export namespace LuasStop {

  export interface Tram {
      dueMins: string;
      destination: string;
  }

  export interface Direction {
      name: string;
      tram: Tram[];
  }

  export interface Stop {
      created: Date;
      stop: string;
      stopAbv: string;
      message: string;
      direction: Direction[];
  }

}

