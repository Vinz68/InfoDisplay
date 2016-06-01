var map = null;
var pinInfobox = null;

function trafficModuleLoaded() {
    var trafficManager = new Microsoft.Maps.Traffic.TrafficManager(map);
    trafficManager.show();
    trafficManager.showFlow();      // Displays the traffic flow layer.
    trafficManager.showIncidents(); // Displays all traffic incidents.
}


function getMap() {
    map = new Microsoft.Maps.Map(document.getElementById('myMap'), {
        credentials: 'AsUectBQ3WWEfwOmyjiOZ4169ogJig4LjYG0oal_MtBICP1GjSct3nxWcXAOD5gY',
        showDashboard: true,
        mapTypeId: Microsoft.Maps.MapTypeId.road,
        center: new Microsoft.Maps.Location(52.063873, 4.598103),
        zoom: 11
    });

    // Show important location with a PushPin
    showPushPin();

    // Load the traffic module
    Microsoft.Maps.loadModule('Microsoft.Maps.Traffic', { callback: trafficModuleLoaded });
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
        title: 'Cerner Nederland BV',
        subTitle: 'www.cerner.com',
        icon: '../images/BluePushpin.png',
        width: 50,
        height: 50,
        draggable: false
    });

    // Add the pushpin to the map
    map.entities.push(pin);
}