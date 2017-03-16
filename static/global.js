(function() {
    "use strict";

    var nodes = [];
    var map;
    var filter = { dcIds: "", dcType: "", from: "", to: "" };

    function isInFilteredDateRange(node) {
        var timestamp = new Date(node.timestamp);

        var fromDate = new Date("2000", "01", "01");
        if (filter.from != "")
            fromDate = new Date(filter.from);

        var toDate = new Date();
        if (filter.to != "")
            toDate = new Date(filter.to);

        return timestamp >= fromDate && timestamp <= toDate;
    }

    function filterData() {
        return data.filter(function(node) {
            var isInDcList = filter.dcIds == "" || filter.dcIds.split(",").indexOf(node.dcId.toString()) > -1;
            var isDesiredType = filter.dcType == "" || filter.dcType == node.dcType;
            var isInDateRange = isInFilteredDateRange(node);

            return isInDcList && isDesiredType && isInDateRange;
        });
    }

    function aggregateData() {
        var dict = filterData(data).reduce(function(prev, curr) {
            if (prev[curr.dcId])
                prev[curr.dcId].responses += curr.responses;
            else
                prev[curr.dcId] = $.extend(true, {}, curr);

            return prev;
        }, {});

        return Object.keys(dict).map(function(key) {
            return dict[key];
        })
    }

    function removeNodes() {
        nodes.forEach(function(n) {
            n.setMap(null);
            n = null;
        });
        nodes = [];
    }

    function attachedEvent(obj, node) {
        var dcStore = (node.dcType == "W" ? "Warehouse: " : "Store: ");

        var infoWindow = new google.maps.InfoWindow({
            content: "<h5>" + dcStore + node.dcId + "</h5> Responses: " + node.responses
        });

        google.maps.event.addListener(obj, 'click', function(ev) {
            infoWindow.setPosition(obj.getCenter());
            infoWindow.open(map);
        });
    }

    function getZoomThreshold(zoom) {
      if (zoom <= 5)
        return 50;
      if (zoom == 6)
        return 30;
      if (zoom == 7)
        return 20;
      if (zoom <= 8)
        return 10;
      if (zoom <= 9)
        return 5;
      if (zoom <= 10)
        return 3;
      if (zoom <= 11)
        return 1;
      if (zoom <= 12)
        return 0.7;
      if (zoom >= 13)
        return 0.3;
    }

    function drawNodes() {
        removeNodes();

        var aggData = aggregateData(data);

        aggData.forEach(function(node) {
            var nodeCenter = new google.maps.LatLng(node.latitude, node.longitude);

            var zoom = map.getZoom();
            console.log(zoom);

            var result = (getZoomThreshold(zoom) * parseInt(node.responses));
            if (result > 500000)
                result = 500000;

            var mapNode = new google.maps.Circle({
                center: nodeCenter,
                radius: result,
                strokeColor: (node.dcType == "W") ? "#FF0000" : "#0000FF",
                strokeOpacity: 0.3,
                strokeWeight: 4,
                fillColor: (node.dcType == "W") ? "#FF0000" : "#0000FF",
                fillOpacity: 0.3,
                clickable: true
            });

            mapNode.setMap(map);
            attachedEvent(mapNode, node);
            nodes.push(mapNode);
        });
    }

    function initialize() {
        var mapProp = {
            zoom: 9,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControlOptions: { mapTypeIds: [] }
        };

        map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

        var geocoder = new google.maps.Geocoder();

        geocoder.geocode({ 'address': 'US' }, function(results, status) {
            var ne = results[0].geometry.viewport.getNorthEast();
            var sw = results[0].geometry.viewport.getSouthWest();

            map.fitBounds(results[0].geometry.viewport);
        });

        map.addListener('zoom_changed', drawNodes);
        //drawNodes();
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        filter.dcIds = $("#dcIds").val();
        filter.dcType = $("form input:radio:checked").val();
        filter.from = $("#fromDate").val();
        filter.to = $("#toDate").val();

        removeNodes();
        drawNodes();
    }

    google.maps.event.addDomListener(window, "load", initialize);

    $(function() {
        $("form").unbind("submit").bind("submit", handleFormSubmit);
    })
})();
