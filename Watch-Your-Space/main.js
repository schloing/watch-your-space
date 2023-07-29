// Libraries used:
// Chart.js - 28/06/2021
// Grid.js - 28/06/2021
// JSON as db (can't be bothered to use a real db) - 29-06-21
// Nevermind... well that aged well, didn't it? Using TaffyDB for the project now, it's similar to JSON and not that hard either :D- 29-06-21

var db = new PouchDB('data');
var remoteCouch = false;


function addData(Name, Time, Results, Logging_speed, Interval_speed, Time_taken) {
    var todo = {
        name: Name,
        time: Time,
        results: Results,
        log_seed: Logging_speed,
        int_speed: Interval_speed,
        t_t: Time_taken,
        _id: new Date().toISOString()
    };
    db.put(todo).then(function (result) {
        console.log(result);
        console.log('Success');
    });

    addDataToTable();
}

function showTodos() {
    db.allDocs({ include_docs: true, descending: true }, function (err, doc) {
        redrawTodosUI(doc.rows);
    });
}

var _date;
var request = new XMLHttpRequest();
var waypoints = new XMLHttpRequest();
var pgNum = 0;
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var xdata = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var month_rec;
var log = [];
var intervalSpeed = 5000;
var loggingSpeed = 1000;

var delayed;

var logging;
var loop;

var complete = false;

addDataToTable();
restartWithParameters();

function restartWithParameters() {
    clearInterval(loop);
    // console.log('CLEARED ' + loop)
    clearInterval(logging);
    // console.log('CLEARED ' + logging)
    logging = setInterval(() => {
        logMonth(month_rec)
    }, parseFloat(loggingSpeed));
    loop = setInterval(sendRequest, parseFloat(intervalSpeed));
}

var ctx = document.getElementById('chart').getContext('2d');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: months,
        datasets: [{
            label: 'Pictures returned from Perseverance',
            data: xdata,
            backgroundColor: [
                'rgba(40, 44, 52, 1)'
            ],
            borderColor: [
                'rgba(63, 69, 80, 1)'
            ],
            borderWidth: 1,
            hoverBackgroundColor: 'rgb(77, 82, 97)'
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: 'rgb(138, 151, 195)'
                }
            },
            x: {
                ticks: {
                    color: 'rgb(138, 151, 195)'
                }
            }
        },
        animation: {
            onComplete: () => {
                delayed = true;
            },
            delay: (context) => {
                let delay = 0;
                if (context.type === 'data' && context.mode === 'default' && !delayed) {
                    delay = context.dataIndex * 300 + context.datasetIndex * 100;
                }
                return delay;
            },
        },
        fill: true,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: 'rgb(138, 151, 195)'
                }
            },
        }
    }
});

//https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json

// waypoints.open('GET', 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json', true)
// waypoints.onload = function () {
//     var data = JSON.parse(this.response);
//     for (var i = 0; i < data.features.length; i++) {
//         // console.log(data.features[i].properties.lon + ', ' + data.features[i].properties.lat + ', ' + data.features[i].properties.sol)
//     }
//     var index = Math.floor(Math.random() * 40);
//     // console.log(data.features[index].properties.lon + ' ----- ' + data.features[index].properties.lat + ' ----- at index ' + index)
//     // document.getElementById('embedded_map').src = 'https://mars.nasa.gov/maps/location/?mission=M20&site=NOW&mapLon=' + data.features[index].properties.lon + '&mapLat=' + data.features[index].properties.lat + '&mapZoom=19&globeLon=' + data.features[index].properties.lon + '&globeLat=' + data.features[index].properties.lat + '&globeZoom=10&globeCamera=0,-4882.8125,0,0,1,0&panePercents=0,100,0&on=Rover%20Position$1.00,Waypoints$1.00,Surface%20View$1.00,Rover%20Path$1.00,Helicopter%20Position$1.00,Helicopter%20Flight%20Zone$1.00,Labels$1.00,Basemap$1.00,North%20East%20Syrtis%20Base%20Map$1.00'; //data.features[index].properties.lat;

// }
// waypoints.send()


function sendRequest() {
    request.open('GET', 'https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=100&page=' + pgNum + '&order=sol+desc&&&undefined', true)
    request.onload = function () {
        var data = JSON.parse(this.response);
        for (y in data.images) {
            var date_rec = data.images[y].date_received.split('T')[0];
            month_rec = date_rec.split('-')[1];
            xdata[parseFloat(month_rec) - 1]++;
        }

        if (data.error_message == "No more images.") {
            clearInterval(loop);
            clearInterval(logging);
            clearInterval(stopwatch);
            console.log('done');
            location.href = "#open-second-modal";
            time = new Date;
            time = time.getDate() + "/"
                + (time.getMonth() + 1) + "/"
                + time.getFullYear() + " @ "
                + time.getHours() + ":"
                + time.getMinutes() + ":"
                + time.getSeconds();
            addData('Name', time, xdata, loggingSpeed, intervalSpeed, h + "h " + m + "m " + s + "s");
        }
    }
    pgNum++;
    request.send();

}


function logMonth(month) {
    chart.data.datasets.forEach((dataset) => {
        dataset.data = xdata;
    });
    chart.update();
    // console.log(xdata);
    // console.log(month_rec);
    // console.log(pgNum);
}

var h = 0;
var m = 0;
var s = 0;
var _stopwatch = setInterval(stopwatch, 1000);

function stopwatch() {
    s++;
    if (s == 60) {
        m++;
        s = 0;
    }
    if (m == 60) {
        h++;
        m = 0;
    }

    if (s < 60 && s > 9) {
        document.getElementById('second').innerHTML = s;
    } else {
        document.getElementById('second').innerHTML = '0' + s;
    }

    if (m < 60 && m > 9) {
        document.getElementById('minute').innerHTML = m;
    } else {
        document.getElementById('minute').innerHTML = '0' + m;
    }

    document.getElementById('hour').innerHTML = '0' + h;


}

function addDataToTable() {

    db.allDocs({ include_docs: true }).then(function (x) { processData(x) });
    // db.allDocs({include_docs:true}).then(function(x){retrievedData = x; console.log(retrievedData)});

}

function processData(input) {
    // console.log(input);
    for (var i = 0; i < input.total_rows; i++) {
        // console.log(input.rows[i].doc.int_speed);
        // console.log(input.rows[i].doc.log_seed);
        // console.log(input.rows[i].doc.t_t);
        // console.log(input.rows[i].doc.results);

        drawTable("name", input.rows[i].doc.time, input.rows[i].doc.results, input.rows[i].doc.log_seed, input.rows[i].doc.int_speed, input.rows[i].doc.t_t);
    }
}

function drawTable(name, time, results, logspeed, intspeed, timetaken) {
    var table = document.getElementById('table');
    var row = table.insertRow(table.rows.length);

    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    var cell6 = row.insertCell(5);

    cell1.innerHTML = name;
    cell2.innerHTML = time;
    cell3.innerHTML = results;
    cell4.innerHTML = logspeed;
    cell5.innerHTML = intspeed;
    cell6.innerHTML = timetaken;
}

