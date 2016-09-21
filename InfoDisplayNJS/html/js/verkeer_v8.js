var map = null;
var trafficManager = null;
var pinInfobox = null;


function GetMap() {
    map = new Microsoft.Maps.Map('#myMap', {
        credentials: 'AsUectBQ3WWEfwOmyjiOZ4169ogJig4LjYG0oal_MtBICP1GjSct3nxWcXAOD5gY',
        showDashboard: true,
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        center: new Microsoft.Maps.Location(52.063873, 4.598103),
        zoom: 11
    });

    //Load traffic module.
    Microsoft.Maps.loadModule('Microsoft.Maps.Traffic', function () {
        //Create an instance of the traffic manager and bind to map.
        trafficManager = new Microsoft.Maps.Traffic.TrafficManager(map);

        //Display the traffic data.
        trafficManager.show();
    });

    // Show important location with a PushPin
    showPushPin();
}

function displayInfobox(e) {
    pinInfobox.setOptions({ visible: true });
}

function hideInfobox(e) {
    pinInfobox.setOptions({ visible: false });
}


function showPushPin() {
    // Define the pushpin location: Cerner NL coordinates 52.077611, 4.334863
    var loc = new Microsoft.Maps.Location(52.077611, 4.334863);

    // Add a pin to the map
    var pin = new Microsoft.Maps.Pushpin(loc, {
        title: 'Cerner Netherlands',
        subTitle: 'www.cerner.com',
        icon: '../images/BluePushpin.png',
        width: 50,
        height: 50,
        draggable: false
    });

    // Add the pushpin to the map
    map.entities.push(pin);
}