declare const $: any;

import { BusRoute } from '../types/db_route';
import { BusStopTimes } from '../types/db_stop';
import { LuasStop } from '../types/luas_stop';
import { LuasStops } from '../types/luas_stops';

const apiHost = 'https://roryhaddon.com';

class latlng {
	latitude: number;
	longitude: number;

	constructor (lat: number, lng: number) {
		this.latitude = lat;
		this.longitude = lng;
	}
};


(function() {
	const _self = {};
	const _strPrefixes = {
		BUS_STOPS:'dbus_stops_',
		BUS_HTML: 'BUS_TIMES_EL_'
	};
	const _init = function() {
		_showWait(true, 'Locating...');
		_refreshLocation();
		_initEvents();
	};
	let _waiterInited = false;
	let _myPos: latlng | null = null;
	let _userAction = false;

	const _initEvents = function() {
		$('#addBus').click(function(event: Event) {
			_userAction = true;
			const entered = $('#addBus_txt').val();
			if (!/^\d{1,3}[a-zA-Z]?$/.test(entered)) {
				alert(`${entered} is an invalid Bus Route`);
				$('#addBus_text').val('');
			} else {
				_showWait(true, 'Getting Bus Times...');
				_getBusStopsOnRoute(entered.toLowerCase());
				$('#addBus_txt').val('');
			}
		});

		$('#busTimes').delegate('div.remove button', 'click', function(e: Event) {
			const prnt = $(e.currentTarget).parents('.route-entry');
			const route = prnt.attr('id').substr(_strPrefixes.BUS_HTML.length);
			delete localStorage[_strPrefixes.BUS_STOPS + route];
			prnt.slideUp({
				duration: 'fast',
				complete: function() {
					prnt.remove()
				}
			});
		});
	};

	const _getBusStopsOnRoute = function(route: string) {
		if (!localStorage[_strPrefixes.BUS_STOPS + route]) {
			$.ajax({
				url:`${apiHost}/api/dublin/bus/route/${route}`,
				dataType:'json',
				success: function(data: BusRoute.Route) {
					localStorage[_strPrefixes.BUS_STOPS + route] = JSON.stringify(data);
					_getBusStopTimes(route, _findClosestBusStops(route));
					_showWait();
				},
				error:function() {
					_showWait();
					alert('An error occurred getting the Bus Stop list :-(');
				}
			});
		} else {
			_getBusStopTimes(route, _findClosestBusStops(route));
		}
	};

	const _getClosestStopFrom = function(stopsList: (BusRoute.InboundStop | BusRoute.OutboundStop)[]) {
		let lowestDist: number | null = null;
		let lowest: number | null = null;
		for (let i =0, len = stopsList.length; i < len; i++) {
			const stop = stopsList[i]
			const dist = _getDistanceBetweenPoints(_myPos!, new latlng(parseFloat(stop.Latitude), parseFloat(stop.Longitude)));
			if (lowestDist === null || dist < lowestDist) {
				lowestDist = dist;
				lowest = i;
			}
		}
		if (lowest) {
			return stopsList[lowest];
		}
		return null;
	}

	const _findClosestBusStops = function(rt: string) {
		const stops = JSON.parse(localStorage[_strPrefixes.BUS_STOPS + rt]) as BusRoute.Route;
		const closest: Record<string, BusRoute.InboundStop | BusRoute.OutboundStop> = {};

		if (stops.stops.InboundStop) {
			const closestInboundStop = _getClosestStopFrom(stops.stops.InboundStop);
			if (closestInboundStop) {
				closest[closestInboundStop.StopNumber]=closestInboundStop;
			}
		}

		if (stops.stops.OutboundStop) {
			const closestOutboundStop = _getClosestStopFrom(stops.stops.OutboundStop);
			if (closestOutboundStop) {
				closest[closestOutboundStop.StopNumber]=closestOutboundStop;
			}
		}

		return closest;
	};

	const _getBusStopTimes = function(route: string, clStops: Record<string, (BusRoute.InboundStop | BusRoute.OutboundStop)>) {
		const callback = function(data: BusStopTimes.Stop) {
			const theStop = data.stopId;
			clStops[theStop].real_time_data = data;
			let gotBothStops = true;
			for (let st in clStops) {
				if (!clStops[st].real_time_data) {
					gotBothStops = false;
					break;
				}
			}
			if (gotBothStops) {
				_renderBusTimesInfo(route, clStops);
			}
		};

		if (Object.keys(clStops).length === 0) {
			_showWait(false);
			_showWait(false);
		}

		for (let stop in clStops) {
			$.getJSON(
				`${apiHost}/api/dublin/bus/stop/${stop}`,
				callback
			);
		}
	};

	const _renderBusTimesInfo = function(rt: string, stops: Record<string, (BusRoute.InboundStop | BusRoute.OutboundStop)>) {
		$('#' + _strPrefixes.BUS_HTML + rt).remove();
		let html='';
		for (const st in stops) {
			let foundData = false;
			html += `<h3 class="bus-stop mui--text-subhead"><span class="label label-info">${rt}</span> ${stops[st].Address}, ${stops[st].Location}</h3>`;
			html += '<table class="mui-table"><tbody>';
			for (const t in stops[st].real_time_data.departures) {
				const rtd = stops[st].real_time_data.departures[t];
				if (rt.toUpperCase() == rtd.MonitoredVehicleJourney_PublishedLineName.toUpperCase()) {
					const congestionClass = (rtd.MonitoredVehicleJourney_InCongestion && rtd.MonitoredVehicleJourney_InCongestion == 'true') ? 'congestion':'';
					html += `<tr><td class='bus-dest'>${rtd.MonitoredVehicleJourney_DestinationName}</td>`;
					html += `<td class='bus-time' class=''+congestionClass+''>${_getMinsBetweenStamps(rtd.MonitoredCall_ExpectedDepartureTime, rtd.Timestamp)}</td></tr>`;
					foundData = true;
				}
			}
			if (!foundData) {
				html += '<tr><td colspan="2">No upcoming departures.</td></tr>';
			}
			html += '</tbody></table>';
		}

		$('#busTimes').append($(`<div id="${_strPrefixes.BUS_HTML + rt}" class="route-entry">${html}<div class='remove'><button class='mui-btn mui-btn--danger'>X</button></div></div>`));
		if (_userAction) {
			$('html,body').animate({
				scrollTop: $('#' + _strPrefixes.BUS_HTML + rt).offset().top
			});
		}
	};

	const _getMinsBetweenStamps = function(st1: string, st2: string) {
		const _getJsDate = function(str: string): Date {
			return new Date(Date.UTC(
                    parseInt(str.substr(0,4),10),
                    parseInt(str.substr(5,2),10)-1,
                    parseInt(str.substr(8,2),10),
                    parseInt(str.substr(11,2),10),
                    parseInt(str.substr(14,2),10),
                    parseInt(str.substr(17,2),10)
                ));
		}

		const mins = Math.abs(Math.floor(( _getJsDate(st1).valueOf() - _getJsDate(st2).valueOf()) / 1000 / 60));
		if (mins == 0) {
			return 'DUE';
		} else {
			return mins;
		}
	}

	const _getDistanceBetweenPoints = function(llOne: latlng, llTwo: latlng) {		//takes google maps LatLng class instances
		const toRad = function(num: number) {
			return num * Math.PI / 180;
		};

		const R = 6371; // radius of earth in km
		const dLat = toRad(llTwo.latitude - llOne.latitude);
		const dLon = toRad(llTwo.longitude - llOne.longitude);
		const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.cos(toRad(llOne.latitude) * Math.cos(toRad(llTwo.latitude))) *
				Math.sin(dLon/2) * Math.sin(dLon/2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		return R * c;
	};

	const _refreshLocation = function() {
		const luasStopPromise = getLuasStops();
		navigator.geolocation.getCurrentPosition(function(position) {
			//console.info(position.coords.latitude, position.coords.longitude);
			_myPos = new latlng(position.coords.latitude, position.coords.longitude);

			luasStopPromise.then(_initLuasSearch);
			_initBusSearch();
		},function() {
			_msgBox(true, 'Geolocation failed. Some features are not enabeld as a result.');
			_showWait(false);
		});
	};

	const _initLuasSearch = function(stops: LuasStops.Stops) {
		const closest = _findClosestLuas(stops);
		if (closest !== null) {
			$('#stationName').text('Luas @ ' + closest.displayName);
			_showWait(true, 'Getting Data...');
			$.ajax({
				url: `${apiHost}/api/dublin/luas/stop/${encodeURIComponent(closest.shortName)}`,
				dataType: 'json'
			}).then(function(data: LuasStop.Stop) {
				_renderData(data);
				_showWait(false);
			}, function(e: Error) {
				_showWait(false);
				$('#luasInfo').html('<p class="error">⛔️ Error getting Luas data</p>');
			});
		}

	};

	const _initBusSearch = function() {
		for (const itm in localStorage) {
			if (itm.indexOf(_strPrefixes.BUS_STOPS) == 0) {
				_getBusStopsOnRoute(itm.substr(_strPrefixes.BUS_STOPS.length));
			}
		}
	};

	const _renderData = function(o: LuasStop.Stop) {
		if (Array.isArray(o) && o.length == 0) { return; }
		let html = `
			<table class="mui-table">
				<thead>
					<tr>
						<th colspan="2">Inbound</th>
						<th colspan="2">Outbound</th>
					</tr>
				</thead>
			<tbody>`;
		let i=0;
		const inboundTrams = o.direction.find(d => d.name === 'Inbound');
		const outboundTrams = o.direction.find(d => d.name === 'Outbound');
		const renderTime = function(coll: LuasStop.Tram[] | undefined, idx: number) {
			if(coll && coll[idx])
				return '<td>'+ coll[idx].dueMins +'</td><td>'+ coll[idx].destination +'</td>';
			else
				return '<td> </td><td> </td>';
		}

		const maxNumTrams = Math.max(inboundTrams && inboundTrams.tram.length || 0 , outboundTrams && outboundTrams.tram.length || 0)
		for(let i = 0; i < maxNumTrams; i += 1) {
			html += '<tr>';
			html +=renderTime(inboundTrams && inboundTrams.tram,i);
			html +=renderTime(outboundTrams && outboundTrams.tram,i);
			html += '</tr>';
			i++;
		}
		html += '</tbody></table>';


		$('#luasInfo').html(html);
	};

	const _findClosestLuas = function(stops: LuasStops.Stops): LuasStops.Station | null {
		let lowestDist: number | null = null;
		let lowest: number | null  = null;

		for (let i = 0, len = stops.stations.length; i < len; i++) {
			const dist = _getDistanceBetweenPoints(_myPos!, new latlng(stops.stations[i].coordinates.latitude, stops.stations[i].coordinates.longitude));
			if (lowestDist === null || dist < lowestDist) {
				lowestDist = dist;
				lowest = i;
			}
		}
		if (lowest) {
			return stops.stations[lowest];
		}
		return null;
	};

	const getLuasStops = (): Promise<LuasStops.Stops> => {
		return $.ajax(`${apiHost}/api/dublin/luas/stops`);
	}

	const _showWait = function(show: boolean = false, msg: string = 'Loading...') {

		if (!_waiterInited) {
			$('body').append(`<div id='waiter' style='display:none'><div class='msg'>${msg}</div></div>`);
			_waiterInited = true;
		}
		if (show) {
			$('#waiter div.msg').text(msg);
			$('#waiter').show();
		} else {
			$('#waiter').hide();
		}
	};

	const _showOverlay = function(show: boolean = true) {
		const _reposition = function() {
			const o = $('#overlay'), bw = $(window).width(), bh = $(window).height();
			o.css({
				width:bw + 'px',
				height:bw + 'px'
			});
		};

		if ($('#overlay').length == 0 && show) {
			$('body').append('<div id="overlay" style="display:none"></div>');
			$(window).bind('resize', _reposition);
		}
		const o = $('#overlay');
		if (show) {
			o.show();
			_reposition();
		} else {
			o.hide();
		}
	};

	const _msgBoxVars = {
		inited: false,
		visible: false
	};

	const _msgBox = function(show: boolean = true, contents?: string) {
		if (!_msgBoxVars.inited) {
			$('body').append(`
				<div id="msgBox" style="display:none">
					<div class="contents"></div>
					<div class="buts">
						<span class="bg-grad ok-but">OK</span>
					</div>
				</div>`);
			$('#msgBox .buts .ok-but').click(function() {
				_msgBox(false);
			});
			_msgBoxVars.inited = true;
		}
		const mb = $('#msgBox');
		if (show) {
			const bw = $('body').innerWidth(), bh = $('body').innerHeight();
			mb.find('.contents').html(contents);
			mb.show();
			mb.css({
				'top': Math.round((bh / 2) - (mb.outerHeight() / 2)) + 'px',
				'left': Math.round((bw / 2) - (mb.outerWidth() / 2)) + 'px'
				});
			_showOverlay(true);
		} else {
			mb.hide();
			_showOverlay(false);
		}
	};

	$(_init);
	return _self;
})();

