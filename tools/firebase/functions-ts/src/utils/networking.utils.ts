import axios from 'axios';
import { CallableRequest, Request } from 'firebase-functions/https';
import { log } from 'firebase-functions/logger';
import { IP_DATA_API_KEY } from '../global';

export async function getIpData(ip) {
  const baseUrl = 'https://api.ipdata.co/';
  try {
    const response = await axios.get(`${baseUrl}${ip}`, {
      params: {
        'api-key': IP_DATA_API_KEY.value()
      }
    });
    const result = response.data;

    if (result) {
      const clean = (str) => str?.replace(/ /g, '_').replace(/\./g, '') ?? null;

      return {
        region: clean(result.region),
        city: clean(result.city),
        country: clean(result.country_name),
        threat: result.threat
      };
    } else {
      console.error('IP data received was null');
      return {};
    }
  } catch (err) {
    console.error('getIpData error:', err);
    return {};
  }
}

export async function getCurrencyDataByIp(
  ip
): Promise<{
  name: string;
  code: string;
  symbol: string;
  native: string;
  plural: string;
}> {
  const url = `https://api.ipdata.co/${ip}/currency`;
  try {
    const response = await axios.get(url, {
      params: {
        'api-key': IP_DATA_API_KEY.value()
      }
    });
    return response.data; // { name, code, symbol, native, plural }
  } catch (err) {
    console.error('getIpCurrency error:', err);
    return { name: null, code: null, symbol: null, native: null, plural: null };
  }
}

export async function getCurrencyDataFromRequest(request: CallableRequest) {
  const rawRequest = request.rawRequest as any;
  const ips = rawRequest.ips;
  const ip =
    ips != null && Array.isArray(ips) && ips.length > 0 ? ips[0] : null;
  let currencyData = null;
  try {
    if (typeof ip == 'string') {
      currencyData = await getCurrencyDataByIp(ip);
      log('Currency data for IP', currencyData);
      if (currencyData?.code && currencyData.symbol) {
        return Promise.resolve({
          currency: currencyData.code,
          symbol: currencyData.symbol
        });
      }
    }
    return Promise.resolve(null);
  } catch (err) {
    return Promise.resolve(null);
  }
}
