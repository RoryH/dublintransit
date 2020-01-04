"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var apiHost = 'https://roryhaddon.com';
var latlng = /** @class */ (function () {
    function latlng(lat, lng) {
        this.latitude = lat;
        this.longitude = lng;
    }
    return latlng;
}());
;
(function () {
    var _self = {};
    var _strPrefixes = {
        BUS_STOPS: 'dbus_stops_',
        BUS_HTML: 'BUS_TIMES_EL_'
    };
    var _init = function () {
        _showWait(true, 'Locating...');
        _refreshLocation();
        _initEvents();
    };
    var _waiterInited = false;
    var _myPos = null;
    var _userAction = false;
    var _initEvents = function () {
        $('#addBus').click(function (event) {
            _userAction = true;
            var entered = $('#addBus_txt').val();
            if (!/^\d{1,3}[a-zA-Z]?$/.test(entered)) {
                alert(entered + " is an invalid Bus Route");
                $('#addBus_text').val('');
            }
            else {
                _showWait(true, 'Getting Bus Times...');
                _getBusStopsOnRoute(entered.toLowerCase());
                $('#addBus_txt').val('');
            }
        });
        $('#busTimes').delegate('div.remove button', 'click', function (e) {
            var prnt = $(e.currentTarget).parents('.route-entry');
            var route = prnt.attr('id').substr(_strPrefixes.BUS_HTML.length);
            delete localStorage[_strPrefixes.BUS_STOPS + route];
            prnt.slideUp({
                duration: 'fast',
                complete: function () {
                    prnt.remove();
                }
            });
        });
    };
    var _getBusStopsOnRoute = function (route) {
        if (!localStorage[_strPrefixes.BUS_STOPS + route]) {
            $.ajax({
                url: apiHost + "/api/dublin/bus/route/" + route,
                dataType: 'json',
                success: function (data) {
                    localStorage[_strPrefixes.BUS_STOPS + route] = JSON.stringify(data);
                    _getBusStopTimes(route, _findClosestBusStops(route));
                    _showWait();
                },
                error: function () {
                    _showWait();
                    alert('An error occurred getting the Bus Stop list :-(');
                }
            });
        }
        else {
            _getBusStopTimes(route, _findClosestBusStops(route));
        }
    };
    var _getClosestStopFrom = function (stopsList) {
        var lowestDist = null;
        var lowest = null;
        for (var i = 0, len = stopsList.length; i < len; i++) {
            var stop_1 = stopsList[i];
            var dist = _getDistanceBetweenPoints(_myPos, new latlng(parseFloat(stop_1.Latitude), parseFloat(stop_1.Longitude)));
            if (lowestDist === null || dist < lowestDist) {
                lowestDist = dist;
                lowest = i;
            }
        }
        if (lowest) {
            return stopsList[lowest];
        }
        return null;
    };
    var _findClosestBusStops = function (rt) {
        var stops = JSON.parse(localStorage[_strPrefixes.BUS_STOPS + rt]);
        var closest = {};
        if (stops.stops.InboundStop) {
            var closestInboundStop = _getClosestStopFrom(stops.stops.InboundStop);
            if (closestInboundStop) {
                closest[closestInboundStop.StopNumber] = closestInboundStop;
            }
        }
        if (stops.stops.OutboundStop) {
            var closestOutboundStop = _getClosestStopFrom(stops.stops.OutboundStop);
            if (closestOutboundStop) {
                closest[closestOutboundStop.StopNumber] = closestOutboundStop;
            }
        }
        return closest;
    };
    var _getBusStopTimes = function (route, clStops) {
        var callback = function (data) {
            var theStop = data.stopId;
            clStops[theStop].real_time_data = data;
            var gotBothStops = true;
            for (var st in clStops) {
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
        for (var stop_2 in clStops) {
            $.getJSON(apiHost + "/api/dublin/bus/stop/" + stop_2, callback);
        }
    };
    var _renderBusTimesInfo = function (rt, stops) {
        $('#' + _strPrefixes.BUS_HTML + rt).remove();
        var html = '';
        for (var st in stops) {
            var foundData = false;
            html += "<h3 class=\"bus-stop mui--text-subhead\"><span class=\"label label-info\">" + rt + "</span> " + stops[st].Address + ", " + stops[st].Location + "</h3>";
            html += '<table class="mui-table"><tbody>';
            for (var t in stops[st].real_time_data.departures) {
                var rtd = stops[st].real_time_data.departures[t];
                if (rt.toUpperCase() == rtd.MonitoredVehicleJourney_PublishedLineName.toUpperCase()) {
                    var congestionClass = (rtd.MonitoredVehicleJourney_InCongestion && rtd.MonitoredVehicleJourney_InCongestion == 'true') ? 'congestion' : '';
                    html += "<tr><td class='bus-dest'>" + rtd.MonitoredVehicleJourney_DestinationName + "</td>";
                    html += "<td class='bus-time' class=''+congestionClass+''>" + _getMinsBetweenStamps(rtd.MonitoredCall_ExpectedDepartureTime, rtd.Timestamp) + "</td></tr>";
                    foundData = true;
                }
            }
            if (!foundData) {
                html += '<tr><td colspan="2">No upcoming departures.</td></tr>';
            }
            html += '</tbody></table>';
        }
        $('#busTimes').append($("<div id=\"" + (_strPrefixes.BUS_HTML + rt) + "\" class=\"route-entry\">" + html + "<div class='remove'><button class='mui-btn mui-btn--danger'>X</button></div></div>"));
        if (_userAction) {
            $('html,body').animate({
                scrollTop: $('#' + _strPrefixes.BUS_HTML + rt).offset().top
            });
        }
    };
    var _getMinsBetweenStamps = function (st1, st2) {
        var _getJsDate = function (str) {
            return new Date(Date.UTC(parseInt(str.substr(0, 4), 10), parseInt(str.substr(5, 2), 10) - 1, parseInt(str.substr(8, 2), 10), parseInt(str.substr(11, 2), 10), parseInt(str.substr(14, 2), 10), parseInt(str.substr(17, 2), 10)));
        };
        var mins = Math.abs(Math.floor((_getJsDate(st1).valueOf() - _getJsDate(st2).valueOf()) / 1000 / 60));
        if (mins == 0) {
            return 'DUE';
        }
        else {
            return mins;
        }
    };
    var _getDistanceBetweenPoints = function (llOne, llTwo) {
        var toRad = function (num) {
            return num * Math.PI / 180;
        };
        var R = 6371; // radius of earth in km
        var dLat = toRad(llTwo.latitude - llOne.latitude);
        var dLon = toRad(llTwo.longitude - llOne.longitude);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(llOne.latitude) * Math.cos(toRad(llTwo.latitude))) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };
    var _refreshLocation = function () {
        var luasStopPromise = getLuasStops();
        navigator.geolocation.getCurrentPosition(function (position) {
            //console.info(position.coords.latitude, position.coords.longitude);
            _myPos = new latlng(position.coords.latitude, position.coords.longitude);
            luasStopPromise.then(_initLuasSearch);
            _initBusSearch();
        }, function () {
            _msgBox(true, 'Geolocation failed. Some features are not enabeld as a result.');
            _showWait(false);
        });
    };
    var _initLuasSearch = function (stops) {
        var closest = _findClosestLuas(stops);
        if (closest !== null) {
            $('#stationName').text('Luas @ ' + closest.displayName);
            _showWait(true, 'Getting Data...');
            $.ajax({
                url: apiHost + "/api/dublin/luas/stop/" + encodeURIComponent(closest.shortName),
                dataType: 'json'
            }).then(function (data) {
                _renderData(data);
                _showWait(false);
            }, function (e) {
                _showWait(false);
                $('#luasInfo').html('<p class="error">⛔️ Error getting Luas data</p>');
            });
        }
    };
    var _initBusSearch = function () {
        for (var itm in localStorage) {
            if (itm.indexOf(_strPrefixes.BUS_STOPS) == 0) {
                _getBusStopsOnRoute(itm.substr(_strPrefixes.BUS_STOPS.length));
            }
        }
    };
    var _renderData = function (o) {
        if (Array.isArray(o) && o.length == 0) {
            return;
        }
        var html = "\n\t\t\t<table class=\"mui-table\">\n\t\t\t\t<thead>\n\t\t\t\t\t<tr>\n\t\t\t\t\t\t<th colspan=\"2\">Inbound</th>\n\t\t\t\t\t\t<th colspan=\"2\">Outbound</th>\n\t\t\t\t\t</tr>\n\t\t\t\t</thead>\n\t\t\t<tbody>";
        var i = 0;
        var inboundTrams = o.direction.find(function (d) { return d.name === 'Inbound'; });
        var outboundTrams = o.direction.find(function (d) { return d.name === 'Outbound'; });
        var renderTime = function (coll, idx) {
            if (coll && coll[idx])
                return '<td>' + coll[idx].dueMins + '</td><td>' + coll[idx].destination + '</td>';
            else
                return '<td> </td><td> </td>';
        };
        var maxNumTrams = Math.max(inboundTrams && inboundTrams.tram.length || 0, outboundTrams && outboundTrams.tram.length || 0);
        for (var i_1 = 0; i_1 < maxNumTrams; i_1 += 1) {
            html += '<tr>';
            html += renderTime(inboundTrams && inboundTrams.tram, i_1);
            html += renderTime(outboundTrams && outboundTrams.tram, i_1);
            html += '</tr>';
            i_1++;
        }
        html += '</tbody></table>';
        $('#luasInfo').html(html);
    };
    var _findClosestLuas = function (stops) {
        var lowestDist = null;
        var lowest = null;
        for (var i = 0, len = stops.stations.length; i < len; i++) {
            var dist = _getDistanceBetweenPoints(_myPos, new latlng(stops.stations[i].coordinates.latitude, stops.stations[i].coordinates.longitude));
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
    var getLuasStops = function () {
        return $.ajax(apiHost + "/api/dublin/luas/stops");
    };
    var _showWait = function (show, msg) {
        if (show === void 0) { show = false; }
        if (msg === void 0) { msg = 'Loading...'; }
        if (!_waiterInited) {
            $('body').append("<div id='waiter' style='display:none'><div class='msg'>" + msg + "</div></div>");
            _waiterInited = true;
        }
        if (show) {
            $('#waiter div.msg').text(msg);
            $('#waiter').show();
        }
        else {
            $('#waiter').hide();
        }
    };
    var _showOverlay = function (show) {
        if (show === void 0) { show = true; }
        var _reposition = function () {
            var o = $('#overlay'), bw = $(window).width(), bh = $(window).height();
            o.css({
                width: bw + 'px',
                height: bw + 'px'
            });
        };
        if ($('#overlay').length == 0 && show) {
            $('body').append('<div id="overlay" style="display:none"></div>');
            $(window).bind('resize', _reposition);
        }
        var o = $('#overlay');
        if (show) {
            o.show();
            _reposition();
        }
        else {
            o.hide();
        }
    };
    var _msgBoxVars = {
        inited: false,
        visible: false
    };
    var _msgBox = function (show, contents) {
        if (show === void 0) { show = true; }
        if (!_msgBoxVars.inited) {
            $('body').append("\n\t\t\t\t<div id=\"msgBox\" style=\"display:none\">\n\t\t\t\t\t<div class=\"contents\"></div>\n\t\t\t\t\t<div class=\"buts\">\n\t\t\t\t\t\t<span class=\"bg-grad ok-but\">OK</span>\n\t\t\t\t\t</div>\n\t\t\t\t</div>");
            $('#msgBox .buts .ok-but').click(function () {
                _msgBox(false);
            });
            _msgBoxVars.inited = true;
        }
        var mb = $('#msgBox');
        if (show) {
            var bw = $('body').innerWidth(), bh = $('body').innerHeight();
            mb.find('.contents').html(contents);
            mb.show();
            mb.css({
                'top': Math.round((bh / 2) - (mb.outerHeight() / 2)) + 'px',
                'left': Math.round((bw / 2) - (mb.outerWidth() / 2)) + 'px'
            });
            _showOverlay(true);
        }
        else {
            mb.hide();
            _showOverlay(false);
        }
    };
    $(_init);
    return _self;
})();
