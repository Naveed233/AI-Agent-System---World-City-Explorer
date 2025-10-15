/**
 * City to IATA Code Mapper
 * Comprehensive mapping for 150+ major cities worldwide
 */

export const CITY_TO_IATA: Record<string, string> = {
  // ========== NORTH AMERICA ==========
  
  // United States - Major Cities
  'NEW YORK': 'JFK',
  'NYC': 'JFK',
  'NEW YORK CITY': 'JFK',
  'LOS ANGELES': 'LAX',
  'LA': 'LAX',
  'CHICAGO': 'ORD',
  'HOUSTON': 'IAH',
  'PHOENIX': 'PHX',
  'PHILADELPHIA': 'PHL',
  'SAN ANTONIO': 'SAT',
  'SAN DIEGO': 'SAN',
  'DALLAS': 'DFW',
  'SAN JOSE': 'SJC',
  'AUSTIN': 'AUS',
  'JACKSONVILLE': 'JAX',
  'FORT WORTH': 'DFW',
  'COLUMBUS': 'CMH',
  'CHARLOTTE': 'CLT',
  'INDIANAPOLIS': 'IND',
  'SAN FRANCISCO': 'SFO',
  'SEATTLE': 'SEA',
  'DENVER': 'DEN',
  'WASHINGTON': 'DCA',
  'BOSTON': 'BOS',
  'NASHVILLE': 'BNA',
  'DETROIT': 'DTW',
  'PORTLAND': 'PDX',
  'LAS VEGAS': 'LAS',
  'MEMPHIS': 'MEM',
  'LOUISVILLE': 'SDF',
  'BALTIMORE': 'BWI',
  'MILWAUKEE': 'MKE',
  'ALBUQUERQUE': 'ABQ',
  'TUCSON': 'TUS',
  'FRESNO': 'FAT',
  'SACRAMENTO': 'SMF',
  'MESA': 'PHX',
  'ATLANTA': 'ATL',
  'KANSAS CITY': 'MCI',
  'COLORADO SPRINGS': 'COS',
  'MIAMI': 'MIA',
  'RALEIGH': 'RDU',
  'OMAHA': 'OMA',
  'LONG BEACH': 'LGB',
  'OAKLAND': 'OAK',
  'MINNEAPOLIS': 'MSP',
  'TULSA': 'TUL',
  'CLEVELAND': 'CLE',
  'WICHITA': 'ICT',
  'ARLINGTON': 'DFW',
  'NEW ORLEANS': 'MSY',
  'TAMPA': 'TPA',
  'HONOLULU': 'HNL',
  'ANCHORAGE': 'ANC',
  
  // Canada
  'TORONTO': 'YYZ',
  'MONTREAL': 'YUL',
  'VANCOUVER': 'YVR',
  'CALGARY': 'YYC',
  'EDMONTON': 'YEG',
  'OTTAWA': 'YOW',
  'WINNIPEG': 'YWG',
  'QUEBEC CITY': 'YQB',
  'HAMILTON': 'YHM',
  'HALIFAX': 'YHZ',
  
  // Mexico
  'MEXICO CITY': 'MEX',
  'GUADALAJARA': 'GDL',
  'MONTERREY': 'MTY',
  'CANCUN': 'CUN',
  'TIJUANA': 'TIJ',
  'PUEBLA': 'PBC',
  'ACAPULCO': 'ACA',
  'MERIDA': 'MID',
  'PUERTO VALLARTA': 'PVR',
  'LOS CABOS': 'SJD',
  
  // ========== EUROPE ==========
  
  // United Kingdom
  'LONDON': 'LHR',
  'MANCHESTER': 'MAN',
  'BIRMINGHAM': 'BHX',
  'GLASGOW': 'GLA',
  'EDINBURGH': 'EDI',
  'LIVERPOOL': 'LPL',
  'BRISTOL': 'BRS',
  'BELFAST': 'BFS',
  
  // France
  'PARIS': 'CDG',
  'MARSEILLE': 'MRS',
  'LYON': 'LYS',
  'TOULOUSE': 'TLS',
  'NICE': 'NCE',
  'NANTES': 'NTE',
  'BORDEAUX': 'BOD',
  'STRASBOURG': 'SXB',
  
  // Germany
  'BERLIN': 'BER',
  'MUNICH': 'MUC',
  'FRANKFURT': 'FRA',
  'HAMBURG': 'HAM',
  'COLOGNE': 'CGN',
  'STUTTGART': 'STR',
  'DUSSELDORF': 'DUS',
  'DORTMUND': 'DTM',
  'LEIPZIG': 'LEJ',
  'DRESDEN': 'DRS',
  
  // Spain
  'MADRID': 'MAD',
  'BARCELONA': 'BCN',
  'VALENCIA': 'VLC',
  'SEVILLE': 'SVQ',
  'BILBAO': 'BIO',
  'MALAGA': 'AGP',
  'PALMA': 'PMI',
  'ALICANTE': 'ALC',
  
  // Italy
  'ROME': 'FCO',
  'MILAN': 'MXP',
  'NAPLES': 'NAP',
  'TURIN': 'TRN',
  'FLORENCE': 'FLR',
  'VENICE': 'VCE',
  'BOLOGNA': 'BLQ',
  'GENOA': 'GOA',
  'PALERMO': 'PMO',
  
  // Netherlands
  'AMSTERDAM': 'AMS',
  'ROTTERDAM': 'RTM',
  'THE HAGUE': 'AMS',
  
  // Switzerland
  'ZURICH': 'ZRH',
  'GENEVA': 'GVA',
  'BASEL': 'BSL',
  'BERN': 'BRN',
  
  // Austria
  'VIENNA': 'VIE',
  'SALZBURG': 'SZG',
  'INNSBRUCK': 'INN',
  
  // Greece
  'ATHENS': 'ATH',
  'THESSALONIKI': 'SKG',
  'HERAKLION': 'HER',
  'RHODES': 'RHO',
  
  // Portugal
  'LISBON': 'LIS',
  'PORTO': 'OPO',
  'FARO': 'FAO',
  
  // Poland
  'WARSAW': 'WAW',
  'KRAKOW': 'KRK',
  'GDANSK': 'GDN',
  'WROCLAW': 'WRO',
  
  // Czech Republic
  'PRAGUE': 'PRG',
  'BRNO': 'BRQ',
  
  // Hungary
  'BUDAPEST': 'BUD',
  
  // Romania
  'BUCHAREST': 'OTP',
  'CLUJ': 'CLJ',
  
  // Belgium
  'BRUSSELS': 'BRU',
  'ANTWERP': 'ANR',
  
  // Ireland
  'DUBLIN': 'DUB',
  'CORK': 'ORK',
  'SHANNON': 'SNN',
  
  // Scandinavia
  'STOCKHOLM': 'ARN',
  'COPENHAGEN': 'CPH',
  'OSLO': 'OSL',
  'HELSINKI': 'HEL',
  'REYKJAVIK': 'KEF',
  
  // Russia
  'MOSCOW': 'SVO',
  'ST PETERSBURG': 'LED',
  'SAINT PETERSBURG': 'LED',
  
  // Turkey
  'ISTANBUL': 'IST',
  'ANKARA': 'ESB',
  'IZMIR': 'ADB',
  'ANTALYA': 'AYT',
  
  // ========== ASIA ==========
  
  // Japan
  'TOKYO': 'NRT',
  'OSAKA': 'KIX',
  'NAGOYA': 'NGO',
  'SAPPORO': 'CTS',
  'FUKUOKA': 'FUK',
  'KYOTO': 'UKY',
  'OKINAWA': 'OKA',
  
  // China
  'BEIJING': 'PEK',
  'SHANGHAI': 'PVG',
  'GUANGZHOU': 'CAN',
  'SHENZHEN': 'SZX',
  'CHENGDU': 'CTU',
  'HANGZHOU': 'HGH',
  'XIAN': 'XIY',
  'CHONGQING': 'CKG',
  'HONG KONG': 'HKG',
  
  // South Korea
  'SEOUL': 'ICN',
  'BUSAN': 'PUS',
  'INCHEON': 'ICN',
  'JEJU': 'CJU',
  
  // Southeast Asia
  'SINGAPORE': 'SIN',
  'BANGKOK': 'BKK',
  'KUALA LUMPUR': 'KUL',
  'MANILA': 'MNL',
  'JAKARTA': 'CGK',
  'HO CHI MINH CITY': 'SGN',
  'SAIGON': 'SGN',
  'HANOI': 'HAN',
  'PHNOM PENH': 'PNH',
  'YANGON': 'RGN',
  'VIENTIANE': 'VTE',
  'PHUKET': 'HKT',
  'BALI': 'DPS',
  'DENPASAR': 'DPS',
  'CHIANG MAI': 'CNX',
  'CEBU': 'CEB',
  
  // India
  'DELHI': 'DEL',
  'NEW DELHI': 'DEL',
  'MUMBAI': 'BOM',
  'BOMBAY': 'BOM',
  'BANGALORE': 'BLR',
  'BENGALURU': 'BLR',
  'CHENNAI': 'MAA',
  'MADRAS': 'MAA',
  'HYDERABAD': 'HYD',
  'KOLKATA': 'CCU',
  'CALCUTTA': 'CCU',
  'AHMEDABAD': 'AMD',
  'PUNE': 'PNQ',
  'GOA': 'GOI',
  'JAIPUR': 'JAI',
  'KOCHI': 'COK',
  'COCHIN': 'COK',
  
  // Middle East
  'DUBAI': 'DXB',
  'ABU DHABI': 'AUH',
  'DOHA': 'DOH',
  'RIYADH': 'RUH',
  'JEDDAH': 'JED',
  'KUWAIT CITY': 'KWI',
  'MUSCAT': 'MCT',
  'AMMAN': 'AMM',
  'BEIRUT': 'BEY',
  'TEL AVIV': 'TLV',
  
  // ========== OCEANIA ==========
  
  'SYDNEY': 'SYD',
  'MELBOURNE': 'MEL',
  'BRISBANE': 'BNE',
  'PERTH': 'PER',
  'ADELAIDE': 'ADL',
  'GOLD COAST': 'OOL',
  'CANBERRA': 'CBR',
  'HOBART': 'HBA',
  'AUCKLAND': 'AKL',
  'WELLINGTON': 'WLG',
  'CHRISTCHURCH': 'CHC',
  
  // ========== SOUTH AMERICA ==========
  
  'SAO PAULO': 'GRU',
  'RIO DE JANEIRO': 'GIG',
  'BRASILIA': 'BSB',
  'SALVADOR': 'SSA',
  'FORTALEZA': 'FOR',
  'BUENOS AIRES': 'EZE',
  'CORDOBA': 'COR',
  'MENDOZA': 'MDZ',
  'SANTIAGO': 'SCL',
  'LIMA': 'LIM',
  'BOGOTA': 'BOG',
  'MEDELLIN': 'MDE',
  'CALI': 'CLO',
  'CARTAGENA': 'CTG',
  'QUITO': 'UIO',
  'GUAYAQUIL': 'GYE',
  'CARACAS': 'CCS',
  'LA PAZ': 'LPB',
  'MONTEVIDEO': 'MVD',
  
  // ========== AFRICA ==========
  
  'CAIRO': 'CAI',
  'ALEXANDRIA': 'ALY',
  'JOHANNESBURG': 'JNB',
  'CAPE TOWN': 'CPT',
  'DURBAN': 'DUR',
  'NAIROBI': 'NBO',
  'MOMBASA': 'MBA',
  'LAGOS': 'LOS',
  'ABUJA': 'ABV',
  'ACCRA': 'ACC',
  'ADDIS ABABA': 'ADD',
  'CASABLANCA': 'CMN',
  'MARRAKECH': 'RAK',
  'TUNIS': 'TUN',
  'ALGIERS': 'ALG',
  'DAR ES SALAAM': 'DAR',
  'KAMPALA': 'EBB',
  'KIGALI': 'KGL',
  'LUSAKA': 'LUN',
  'HARARE': 'HRE',
};

/**
 * Get IATA code for a city name
 * Handles variations and returns best match
 */
export function getIATACode(cityOrCode: string): string {
  const city = cityOrCode.toUpperCase().trim();

  // If already a 3-letter code, return it
  if (/^[A-Z]{3}$/.test(city)) {
    return city;
  }

  // Direct lookup
  if (CITY_TO_IATA[city]) {
    return CITY_TO_IATA[city];
  }

  // Try partial match (for cases like "New York NY")
  for (const [key, value] of Object.entries(CITY_TO_IATA)) {
    if (city.includes(key) || key.includes(city)) {
      return value;
    }
  }

  // If no match, return first 3 letters as fallback
  return city.substring(0, 3);
}

/**
 * Get city name from IATA code
 */
export function getCityFromIATA(code: string): string {
  const iata = code.toUpperCase();
  
  for (const [city, iataCode] of Object.entries(CITY_TO_IATA)) {
    if (iataCode === iata) {
      // Return properly capitalized city name
      return city.split(' ').map(word => 
        word.charAt(0) + word.slice(1).toLowerCase()
      ).join(' ');
    }
  }
  
  return code;
}

/**
 * Check if a city name is ambiguous (exists in multiple countries)
 */
export function isAmbiguousCity(cityName: string): boolean {
  const city = cityName.toUpperCase().trim();
  
  const ambiguousCities = [
    'LONDON', 'PARIS', 'ROME', 'BERLIN', 'MOSCOW', 
    'PORTLAND', 'MANCHESTER', 'BIRMINGHAM', 'CAMBRIDGE',
    'OXFORD', 'SPRINGFIELD', 'WASHINGTON', 'BOSTON',
  ];
  
  return ambiguousCities.includes(city);
}

/**
 * Get suggestions for ambiguous cities
 */
export function getAmbiguousCitySuggestions(cityName: string): string[] {
  const city = cityName.toUpperCase().trim();
  
  const suggestions: Record<string, string[]> = {
    'LONDON': ['London, United Kingdom (LHR)', 'London, Ontario, Canada (YXU)'],
    'PARIS': ['Paris, France (CDG)', 'Paris, Texas, USA (PRX)'],
    'BIRMINGHAM': ['Birmingham, UK (BHX)', 'Birmingham, Alabama, USA (BHM)'],
    'PORTLAND': ['Portland, Oregon, USA (PDX)', 'Portland, Maine, USA (PWM)'],
    'WASHINGTON': ['Washington, D.C., USA (DCA)', 'Washington State, USA (SEA)'],
  };
  
  return suggestions[city] || [];
}

