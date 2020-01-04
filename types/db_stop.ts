export namespace BusStopTimes {

  export interface Attributes {
      ['diffgr:id']: string;
      ['msdata:rowOrder']: string;
  }

  export interface Departure {
      attributes: Attributes;
      ServiceDelivery_ResponseTimestamp: string;
      ServiceDelivery_ProducerRef: string;
      ServiceDelivery_Status: string;
      ServiceDelivery_MoreData: string;
      StopMonitoringDelivery_Version: string;
      StopMonitoringDelivery_ResponseTimestamp: string;
      StopMonitoringDelivery_RequestMessageRef?: any;
      MonitoredStopVisit_RecordedAtTime: string;
      MonitoredStopVisit_MonitoringRef: string;
      MonitoredVehicleJourney_LineRef: string;
      MonitoredVehicleJourney_DirectionRef: string;
      FramedVehicleJourneyRef_DataFrameRef: string;
      FramedVehicleJourneyRef_DatedVehicleJourneyRef: string;
      MonitoredVehicleJourney_PublishedLineName: string;
      MonitoredVehicleJourney_OperatorRef: string;
      MonitoredVehicleJourney_DestinationRef: string;
      MonitoredVehicleJourney_DestinationName: string;
      MonitoredVehicleJourney_Monitored: string;
      MonitoredVehicleJourney_InCongestion: string;
      MonitoredVehicleJourney_BlockRef: string;
      MonitoredVehicleJourney_VehicleRef: string;
      MonitoredCall_VisitNumber: string;
      MonitoredCall_VehicleAtStop: string;
      MonitoredCall_AimedArrivalTime: string;
      MonitoredCall_ExpectedArrivalTime: string;
      MonitoredCall_AimedDepartureTime: string;
      MonitoredCall_ExpectedDepartureTime: string;
      Timestamp: string;
      LineNote?: any;
  }

  export interface Stop {
      stopId: string;
      departures: Departure[];
  }

}

