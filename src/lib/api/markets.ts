/**
 * Markets API - Fetch market data from Finnhub
 *
 * Get your free API key at: https://finnhub.io/
 * Free tier: 60 calls/minute
 */

import { INDICES, SECTORS, COMMODITIES, CRYPTO } from '$lib/config/markets';
import type { MarketItem, SectorPerformance, CryptoItem } from '$lib/types';
import { CORS_PROXY_URL, logger, FINNHUB_API_KEY, FINNHUB_BASE_URL } from '$lib/config/api';

interface CoinGeckoPrice {
	usd: number;
	usd_24h_change?: number;
}

interface CoinGeckoPricesResponse {
	[key: string]: CoinGeckoPrice;
}

interface FinnhubQuote {
	c: number; // Current price
	d: number; // Change
	dp: number; // Percent change
	h: number; // High price of the day
	l: number; // Low price of the day
	o: number; // Open price of the day
	pc: number; // Previous close price
	t: number; // Timestamp
}

/**
 * Check if Finnhub API key is configured
 */
function hasFinnhubApiKey(): boolean {
	return Boolean(FINNHUB_API_KEY && FINNHUB_API_KEY.length > 0);
}

// Map index symbols to ETF proxies (free tier doesn't support direct indices)
const INDEX_ETF_MAP: Record<string, string> = {
	'^DJI': 'DIA', // Dow Jones -> SPDR Dow Jones ETF
	'^GSPC': 'SPY', // S&P 500 -> SPDR S&P 500 ETF
	'^IXIC': 'QQQ', // NASDAQ -> Invesco QQQ (NASDAQ-100)
	'^RUT': 'IWM' // Russell 2000 -> iShares Russell 2000 ETF
};

/**
 * Fetch a quote from Finnhub
 */
async function fetchFinnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
	try {
		const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data: FinnhubQuote = await response.json();

		// Finnhub returns all zeros when symbol not found
		if (data.c === 0 && data.pc === 0) {
			return null;
		}

		return data;
	} catch (error) {
		logger.error('Markets API', `Error fetching quote for ${symbol}:`, error);
		return null;
	}
}

/**
 * Fetch crypto prices from CoinGecko via proxy
 */
export async function fetchCryptoPrices(): Promise<CryptoItem[]> {
	try {
		const ids = CRYPTO.map((c) => c.id).join(',');
		const coinGeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

		// Use proxy to avoid CORS/rate limiting issues
		const proxyUrl = CORS_PROXY_URL + encodeURIComponent(coinGeckoUrl);
		logger.log('Markets API', 'Fetching crypto from:', proxyUrl);

		const response = await fetch(proxyUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data: CoinGeckoPricesResponse = await response.json();

		return CRYPTO.map((crypto) => {
			const priceData = data[crypto.id];
			return {
				id: crypto.id,
				symbol: crypto.symbol,
				name: crypto.name,
				current_price: priceData?.usd || 0,
				price_change_24h: priceData?.usd_24h_change || 0,
				price_change_percentage_24h: priceData?.usd_24h_change || 0
			};
		});
	} catch (error) {
		logger.error('Markets API', 'Error fetching crypto:', error);
		return CRYPTO.map((c) => ({
			id: c.id,
			symbol: c.symbol,
			name: c.name,
			current_price: 0,
			price_change_24h: 0,
			price_change_percentage_24h: 0
		}));
	}
}

/**
 * Fetch market indices from Finnhub
 */
export async function fetchIndices(): Promise<MarketItem[]> {
	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured. Add VITE_FINNHUB_API_KEY to .env');
		return INDICES.map((index) => ({
			symbol: index.symbol,
			name: index.name,
			price: NaN,
			change: NaN,
			changePercent: NaN,
			type: 'index' as const
		}));
	}

	try {
		logger.log('Markets API', 'Fetching indices from Finnhub');

		// Fetch all indices in parallel (using ETF proxies)
		const quotes = await Promise.all(
			INDICES.map(async (index) => {
				const etfSymbol = INDEX_ETF_MAP[index.symbol] || index.symbol;
				const quote = await fetchFinnhubQuote(etfSymbol);
				return { index, quote };
			})
		);

		return quotes.map(({ index, quote }) => ({
			symbol: index.symbol,
			name: index.name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN,
			type: 'index' as const
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching indices:', error);
		return INDICES.map((index) => ({
			symbol: index.symbol,
			name: index.name,
			price: NaN,
			change: NaN,
			changePercent: NaN,
			type: 'index' as const
		}));
	}
}

/**
 * Fetch sector performance from Finnhub (using sector ETFs)
 */
export async function fetchSectorPerformance(): Promise<SectorPerformance[]> {
	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured');
		return SECTORS.map((sector) => ({
			symbol: sector.symbol,
			name: sector.name,
			price: NaN,
			change: NaN,
			changePercent: NaN
		}));
	}

	try {
		logger.log('Markets API', 'Fetching sector performance from Finnhub');

		// Fetch all sector ETFs in parallel
		const quotes = await Promise.all(
			SECTORS.map(async (sector) => {
				const quote = await fetchFinnhubQuote(sector.symbol);
				return { sector, quote };
			})
		);

		return quotes.map(({ sector, quote }) => ({
			symbol: sector.symbol,
			name: sector.name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching sectors:', error);
		return SECTORS.map((sector) => ({
			symbol: sector.symbol,
			name: sector.name,
			price: NaN,
			change: NaN,
			changePercent: NaN
		}));
	}
}

// Finnhub commodity ETF proxies (free tier doesn't support direct commodities)
const COMMODITY_SYMBOL_MAP: Record<string, string> = {
	'^VIX': 'VIXY', // VIX -> ProShares VIX Short-Term Futures ETF
	'GC=F': 'GLD', // Gold -> SPDR Gold Shares
	'CL=F': 'USO', // Crude Oil -> United States Oil Fund
	'NG=F': 'UNG', // Natural Gas -> United States Natural Gas Fund
	'SI=F': 'SLV', // Silver -> iShares Silver Trust
	'HG=F': 'CPER' // Copper -> United States Copper Index Fund
};

/**
 * Fetch commodities from Finnhub
 */
export async function fetchCommodities(): Promise<MarketItem[]> {
	if (!hasFinnhubApiKey()) {
		logger.warn('Markets API', 'Finnhub API key not configured');
		return COMMODITIES.map((commodity) => ({
			symbol: commodity.symbol,
			name: commodity.name,
			price: NaN,
			change: NaN,
			changePercent: NaN,
			type: 'commodity' as const
		}));
	}

	try {
		logger.log('Markets API', 'Fetching commodities from Finnhub');

		// Fetch all commodities in parallel
		const quotes = await Promise.all(
			COMMODITIES.map(async (commodity) => {
				const finnhubSymbol = COMMODITY_SYMBOL_MAP[commodity.symbol] || commodity.symbol;
				const quote = await fetchFinnhubQuote(finnhubSymbol);
				return { commodity, quote };
			})
		);

		return quotes.map(({ commodity, quote }) => ({
			symbol: commodity.symbol,
			name: commodity.name,
			price: quote?.c ?? NaN,
			change: quote?.d ?? NaN,
			changePercent: quote?.dp ?? NaN,
			type: 'commodity' as const
		}));
	} catch (error) {
		logger.error('Markets API', 'Error fetching commodities:', error);
		return COMMODITIES.map((commodity) => ({
			symbol: commodity.symbol,
			name: commodity.name,
			price: NaN,
			change: NaN,
			changePercent: NaN,
			type: 'commodity' as const
		}));
	}
}

/**
 * Fetch all market data
 */
export async function fetchAllMarkets() {
	const [crypto, indices, sectors, commodities] = await Promise.all([
		fetchCryptoPrices(),
		fetchIndices(),
		fetchSectorPerformance(),
		fetchCommodities()
	]);

	return { crypto, indices, sectors, commodities };
}
