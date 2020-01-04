export namespace LuasStops {

  export interface Coordinates {
      latitude: number;
      longitude: number;
  }

  export interface Station {
      shortName: string;
      displayName: string;
      displayIrishName: string;
      line: string;
      cycle: number;
      car: number;
      coordinates: Coordinates;
  }

  export interface Stops {
      stations: Station[];
  }

}

