export {};

// Just the slice of the Google Maps Places API that StartRound uses.
type PlacesAutocomplete = {
  addListener(event: 'place_changed', handler: () => void): void;
  getPlace(): { name?: string };
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (input: HTMLInputElement, opts?: { types?: string[] }) => PlacesAutocomplete;
        };
      };
    };
  }
}
