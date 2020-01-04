import { BusStopTimes } from './db_stop';

export namespace BusRoute {

  export interface Attributes {
      ['diffgr:id']: string;
      ['msdata:rowOrder']: string;
  }

  export interface RouteDetails {
      attributes: Attributes;
      RouteID: string;
      RouteNumber: string;
      RouteDescription: string;
      StartStageID: string;
      EndStageID: string;
      DepotID: string;
      IsDisabled: string;
      IsExpresso: string;
      IsNitelink: string;
      IsAirlink: string;
      IsRaillink: string;
      IsSchoollink: string;
      InBoundFrequency: string;
      OutBoundFrequency: string;
      InBoundPattern: string;
      OutBoundPattern: string;
      RouteCategoryID: string;
      IsMinimumFare: string;
      StartStageName: string;
      EndStageName: string;
  }

  export interface InboundStop {
      attributes: Attributes;
      Route: string;
      Direction: string;
      StopNumber: string;
      Address: string;
      Location: string;
      SeqNumber: string;
      Latitude: string;
      Longitude: string;
      SeqNumberExt: string;
      real_time_data: BusStopTimes.Stop;
  }

  export interface OutboundStop {
      attributes: Attributes;
      Route: string;
      Direction: string;
      StopNumber: string;
      Address: string;
      Location: string;
      SeqNumber: string;
      Latitude: string;
      Longitude: string;
      SeqNumberExt: string;
      real_time_data: BusStopTimes.Stop;
  }

  export interface Stops {
      Route: RouteDetails;
      InboundStop: InboundStop[];
      OutboundStop: OutboundStop[];
  }

  export interface Route {
      route: string;
      stops: Stops;
  }

}

