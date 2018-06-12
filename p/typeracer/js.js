// taken from  https://github.com/chartjs/Chart.js/blob/543c31d5496526a47123a923fef95c22f6980f4d/samples/utils.js

window.chartColors = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)',
	turquoise: 'rgb(64,224,208)',
	pink: 'rgb(231,152,233)',
	light_steel_blue: 'rgb(176,196,222)',
};

// end of chart consts

function build_typeracer_url(username, n = 1) {
	return "//typeracerdata-hrd.appspot.com/games?n=" + n + "&universe=play&playerId=tr:" + encodeURI(username)
}

function get_race_data(url, jsonp = true) {
	var dtype = undefined;
	if (jsonp) {
		dtype = 'jsonp';
	}
	return $.ajax({
		url: url,
		dataType: dtype
	});
}




function show_place_pie_chart(place_pie_data, target_id) {
	var ctx = document.getElementById(target_id).getContext('2d');
	var total = place_pie_data.count.reduce((a, b) => a + b, 0);

	var config = {

		type: 'pie',
		data: {
			datasets: [{
				data: place_pie_data.count,
				backgroundColor: Object.values(window.chartColors).slice(0, place_pie_data.count.length),
				label: 'Place distrbution'
			}],
			labels: place_pie_data.names
		},
		options: {

			plugins: {
				datalabels: {

					borderRadius: 25,
					borderWidth: 2,
					color: 'white',
					display: function (context) {
						var dataset = context.dataset;
						var value = dataset.data[context.dataIndex];
						return value / total > 0.1;
					},
					font: {
						weight: 'bold'
					},
					formatter: Math.round
				}
			},

			tooltips: {
				displayColors: false,
				callbacks: {
					label: function (tooltipItem, data) {
						//get the concerned dataset

						var dataset = data.datasets[tooltipItem.datasetIndex];
						//calculate the total of this data set
						var total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
							return previousValue + currentValue;
						});
						//get the current items value
						var currentValue = dataset.data[tooltipItem.index];
						//calculate the precentage based on the total and current item, also this does a rough rounding to give a whole number
						var precentage = Math.floor(((currentValue / total) * 100) + 0.5);

						return data.labels[tooltipItem.index] + ': ' + currentValue + '(' + precentage + "%)";
					}
				}
			},
			responsive: true,
			legend: {
				position: 'bottom',
			},
			title: {
				display: true,
				text: 'Place distribution (' + total + ' total)'
			},
		}
	};


	var chart = new Chart(ctx, config);

}

function defaultDict() {
	this.get = function (key) {
		if (this.hasOwnProperty(key)) {
			return key;
		} else {
			return 0;
		}
	}
}

function convert_numbers_to_places(ns) {
	places = []
	ns.forEach(function (e, i) {
		s = e.toString()
		switch (e % 10) {
			case 1:
				s += 'st';
				break;
			case 2:
				s += 'nd';
				break;
			case 3:
				s += 'rd';
				break;
			default:
				s += 'th';
				break
		}
		places.push(s);
	});
	return places;
}

function build_pie_data(d) {
	places = {}
	d.forEach(function (e, i) {

		places[e.r] = (places[e.r] || 0) + 1;
	});

	ks = Object.keys(places);
	vs = Object.values(places);
	ks = convert_numbers_to_places(ks);

	return { count: vs, names: ks };
}

function build_speed_time(d) {
	datetimes = [];
	speeds = [];
	percentages = [];
	avg_speed = 0;
	max = 0;
	min = 500;
	var rwpm = 0;
	avg_perc = 0
	d.forEach(function (e, i) {
		rwpm = Math.round(e.wpm);
		avg_speed += e.wpm;
		datetimes.push(e.t * 1000); // milliseconds
		speeds.push(rwpm);
		percentages.push(Math.round(e.ac * 1000) / 10);
		avg_perc += Math.round(e.ac * 1000) / 10
		max = Math.max(rwpm, max)
		min = Math.min(rwpm, min)
	});

	avg_speed = Math.round(avg_speed / speeds.length);
	return { min: min, max: max, perc: percentages, scores: speeds, dates: datetimes, avg: avg_speed, avg_perc: Math.round(avg_perc / percentages.length) };
}


function show_score_date_line(score_date_data, target_id) {
	var ctx = document.getElementById(target_id).getContext('2d');
	var xys_score = [];
	var xys_perc = [];

	for (var i = 0; i < score_date_data.scores.length; i++) {
		xys_score.push({ label: '', x: score_date_data.dates[i], y: score_date_data.scores[i] });

		xys_perc.push({ label: '', x: score_date_data.dates[i], y: score_date_data.perc[i] });
	}
	var config = {
		type: 'scatter',
		data: {

			//labels: score_date_data.dates,
			datasets: [{
				backgroundColor: window.chartColors.pink,
				//borderColor: window.chartColors.orange,
				// data: score_date_data.scores,
				data: xys_score,
				alpha: 0.2,
				label: 'WPM',
				showLine: false,
				// fill: 'origin'
			}]
		},
		options: {

			animation: false,

			tooltips: {
				enabled: false,
				displayColors: false,
				callbacks: {
					label: function (tooltipItem, data) {
						return '';
						var onlydate = tooltipItem.xLabel.split(' ').slice(0, 3).join(' ');
						// var label = data.labels[tooltipItem.index]; 
						return tooltipItem.yLabel + ' - ' + onlydate;
					}
				}
			},
			elements: { point: { radius: 3 } },
			scales: {
				yAxes: [{
					scaleLabel: {
						display: true,

						labelString: 'WPM'
					}
				}],
				xAxes: [{
					display: true,
					type: 'time',
				}],

			},
			title: {
				display: true,
				text: ['Average (wpm): ' + score_date_data.avg,
				'Max: ' + score_date_data.max,
				'Min: ' + score_date_data.min]
			}, legend: { display: false }
		}
	};

	var c = new Chart(ctx, config);

	return c;
}

function show_acc_date_line(score_date_data, target_id) {
	var ctx = document.getElementById(target_id).getContext('2d');
	var xys_score = [];
	var xys_perc = [];

	for (var i = 0; i < score_date_data.scores.length; i++) {
		xys_score.push({ label: '', x: score_date_data.dates[i], y: score_date_data.scores[i] });

		xys_perc.push({ label: '', x: score_date_data.dates[i], y: score_date_data.perc[i] });
	}
	var config = {
		type: 'scatter',
		data: {

			//labels: score_date_data.dates,
			datasets: [{
				backgroundColor: window.chartColors.blue,
				//borderColor: window.chartColors.orange,
				// data: score_date_data.scores,
				data: xys_perc,
				alpha: 0.2,
				label: 'Accuracy',
				showLine: false,
				// fill: 'origin'
			}]
		},
		options: {

			animation: false,

			tooltips: {
				enabled: false,
				displayColors: false,
				callbacks: {
					label: function (tooltipItem, data) {
						return '';
						var onlydate = tooltipItem.xLabel.split(' ').slice(0, 3).join(' ');
						// var label = data.labels[tooltipItem.index]; 
						return tooltipItem.yLabel + ' - ' + onlydate;
					}
				}
			},
			elements: { point: { radius: 3 } },
			scales: {
				yAxes: [{
					scaleLabel: {
						display: true,

						labelString: 'Accuracy'
					}
				}],
				xAxes: [{
					display: true,
					type: 'time',
				}],

			},
			title: {
				display: true,
				text: 'Average Accuracy: ' + score_date_data.avg_perc + '%'

			}, legend: { display: false }


		}


	};


	var c = new Chart(ctx, config);

	return c;
}

function build_hourly(d) {
	var acc = 0;
	var wpm = 0;

	wpm_sum_per_hr = {};
	acc_sum_per_hr = {};
	for (var i = 0; i < 24; i++) {
		wpm_sum_per_hr[i] = { sum: 0, count: 0 };
		acc_sum_per_hr[i] = { sum: 0, count: 0 };
	}

	d.forEach(function (e, i) {
		var d = new Date(e.t * 1000);
		acc = Math.round(e.ac * 1000) / 10;
		wpm = Math.round(e.wpm);

		acc_sum_per_hr[d.getHours()].count += 1; acc_sum_per_hr[d.getHours()].sum += wpm;

		wpm_sum_per_hr[d.getHours()].count += 1; wpm_sum_per_hr[d.getHours()].sum += acc;
	});

	speed_dataset = [];
	acc_dataset = [];
	hours = [];
	min_acc = 0;
	min_wpm = 0;
	coun_per_hr = [];

	for (var i = 0; i < 24; i++) {
		hour_str = '';
		var wpmavg = Math.round(wpm_sum_per_hr[i].sum / wpm_sum_per_hr[i].count);
		var accavg = Math.round(acc_sum_per_hr[i].sum / acc_sum_per_hr[i].count);

		//wpmavg = wpmavg || 0;
		//accavg = accavg || 0;
		if (wpmavg) min_wpm = Math.min(min_wpm, wpmavg);
		if (accavg) min_wpm = Math.min(min_acc, accavg);
		if (i < 10) {
			hour_str = "0";
		}
		hour_str += i;

		speed_dataset.push(wpmavg)
		acc_dataset.push(accavg)
		coun_per_hr.push(wpm_sum_per_hr[i].count)
		hours.push(hour_str);
	}

	return { races_count: coun_per_hr, min_acc: min_acc, min_wpm: min_wpm, speeds: speed_dataset, accs: acc_dataset, times: hours }
}


function show_hourly_avg(hrly_data, target_id) {
	var ctx = document.getElementById(target_id).getContext('2d');


	var lineChartData = {
		labels: hrly_data.times,
		datasets: [{
			// borderWidth: 2,
			label: 'WPM',
			borderColor: window.chartColors.pink,
			backgroundColor: window.chartColors.pink,
			fill: false,
			data: hrly_data.speeds,
			yAxisID: 'y-axis-1',
		}, {
			label: 'Accuracy',
			borderColor: window.chartColors.blue,
			backgroundColor: window.chartColors.blue,
			fill: false,
			data: hrly_data.accs,
			yAxisID: 'y-axis-2'
		}]
	};

	Chart.Line(ctx, {
		data: lineChartData,
		options: {
			animation: false,
			tooltips: {
				mode: 'index',

			},
			plugins: {
				datalabels: {

					display: function (context) {
						return true;
					},
					font: {
						size: 20,
						// weight: 'bold'
					},
					formatter: function (c) { return ''; }
				}
			},
			spanGaps: true,
			responsive: true,
			hoverMode: 'index',
			stacked: false,
			title: {
				display: true,
				text: 'WPM & accuracy by time of day'
			},
			scales: {
				xAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Time of Day'
					},
				}],
				yAxes: [{
					display: true,

					//type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'left',
					id: 'y-axis-1',
					scaleLabel: {
						display: true,
						labelString: 'WPM'
					}
				}, {
					scaleLabel: {
						display: true,
						labelString: 'Accuracy (%)'
					},
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'right',
					id: 'y-axis-2',

					// grid line settings
					gridLines: {
						drawOnChartArea: false, // only want the grid lines for one axis to show up
					},
				}],
			}
		}
	});



}



function show_hourly_avg_count(hrly_data, target_id) {
	var ctx = document.getElementById(target_id).getContext('2d');
	var barChartData = {
		labels: hrly_data.times,
		datasets: [{
			// label: 'Dataset 1',
			backgroundColor: window.chartColors.orange,
			borderColor: window.chartColors.orange,
			borderWidth: 1,
			data:hrly_data.races_count
		}]

	};
	new Chart(ctx, {
		type: 'bar',
		data: barChartData,
		options: {
			onAnimationComplete: function()
    {
        this.showTooltip(this.datasets[0].bars, true);
    },
			plugins:{
				 datalabels:{align :'end', anchor: 'end',
				 display: function (context) {
					var dataset = context.dataset;
					var value = dataset.data[context.dataIndex];
					return value;
				},
			}

			},
			responsive: true,
			legend: {
				display:false,
				position: 'top',
			},
			title: {
				display: true,
				text: 'No. of races, by hour'
			}
		}
	});
}


























