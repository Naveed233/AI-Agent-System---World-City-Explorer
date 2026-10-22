/**
 * FIXTURE DATA, not real search results.
 * Hand-written to follow the field names SerpApi documents for its google_flights,
 * google_hotels and google engines, so the parsers can be tested offline.
 * Prices, flights and hotels here are invented for tests only.
 */

export const flightsResponse = {
  search_metadata: {
    status: 'Success',
    google_flights_url: 'https://www.google.com/travel/flights?hl=en&tfs=FIXTURE',
  },
  best_flights: [
    {
      flights: [
        {
          departure_airport: { name: 'Haneda Airport', id: 'HND', time: '2026-11-05 11:30' },
          arrival_airport: { name: 'Heathrow Airport', id: 'LHR', time: '2026-11-05 16:45' },
          duration: 855,
          airline: 'Japan Airlines',
          flight_number: 'JL 43',
          travel_class: 'Economy',
        },
      ],
      total_duration: 855,
      price: 1240,
      type: 'One way',
    },
  ],
  other_flights: [
    {
      flights: [
        {
          departure_airport: { name: 'Haneda Airport', id: 'HND', time: '2026-11-05 22:10' },
          arrival_airport: { name: 'Dubai International Airport', id: 'DXB', time: '2026-11-06 04:30' },
          duration: 680,
          airline: 'Emirates',
          flight_number: 'EK 313',
        },
        {
          departure_airport: { name: 'Dubai International Airport', id: 'DXB', time: '2026-11-06 07:45' },
          arrival_airport: { name: 'Heathrow Airport', id: 'LHR', time: '2026-11-06 11:50' },
          duration: 485,
          airline: 'Emirates',
          flight_number: 'EK 1',
        },
      ],
      layovers: [{ duration: 195, name: 'Dubai International Airport', id: 'DXB' }],
      total_duration: 1360,
      price: 980,
      type: 'One way',
    },
    {
      // No price: sold out or not shown. Must be kept but sorted last.
      flights: [
        {
          departure_airport: { name: 'Narita International Airport', id: 'NRT', time: '2026-11-05 09:00' },
          arrival_airport: { name: 'Heathrow Airport', id: 'LHR', time: '2026-11-05 14:30' },
          duration: 870,
          airline: 'British Airways',
          flight_number: 'BA 6',
        },
      ],
      total_duration: 870,
      type: 'One way',
    },
    { flights: [] }, // malformed entry: must be skipped, not crash
  ],
  price_insights: { lowest_price: 980, price_level: 'typical', typical_price_range: [900, 1400] },
};

export const hotelsResponse = {
  search_metadata: { status: 'Success', google_hotels_url: 'https://www.google.com/travel/hotels?q=FIXTURE' },
  ads: [{ name: 'Sponsored Hotel', extracted_price: 10 }],
  properties: [
    {
      type: 'hotel',
      name: 'Fixture Hotel Shinjuku',
      link: 'https://example.com/fixture-shinjuku',
      check_in_time: '3:00 PM',
      rate_per_night: { lowest: '$180', extracted_lowest: 180 },
      total_rate: { lowest: '$360', extracted_lowest: 360 },
      overall_rating: 4.4,
      reviews: 2310,
      extracted_hotel_class: 4,
      amenities: ['Free Wi-Fi', 'Air conditioning', 'Restaurant', 'Bar', 'Laundry', 'Fitness centre', 'Spa'],
      images: [{ thumbnail: 'https://example.com/thumb.jpg' }],
    },
    {
      type: 'vacation rental',
      name: '  Fixture Apartment  ',
      link: 'javascript:alert(1)', // unsafe link must be dropped
      rate_per_night: { lowest: '$95' }, // no extracted number
      overall_rating: 4.1,
    },
    { type: 'hotel' }, // no name: skipped
  ],
};

export const searchResponse = {
  answer_box: { answer: '3,800 yen' },
  organic_results: [
    { position: 1, title: 'Tickets | Fixture Museum', link: 'https://example.com/tickets', snippet: 'Adults 3,800 yen.' },
    { position: 2, title: 'Visit guide', link: 'https://example.com/guide' },
    { position: 3, snippet: 'missing title and link' },
  ],
};

export const noResultsError = { error: "Google hasn't returned any results for this query." };
export const invalidKeyError = { error: 'Invalid API key. Your API key should be here: https://serpapi.com/manage-api-key' };
export const quotaError = { error: 'Your account has run out of searches.' };
