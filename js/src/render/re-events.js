//Variables

var zoomFactor = 1.0;

var leftWindowTime = calcLeftWindowTime(zoomFactor, simuTime);
var rightWindowTime = calcRightWindowTime(zoomFactor, simuTime);

var dataEvents = {} ;
var startEventsTime = leftWindowTime ;
var endEventsTime = rightWindowTime + 50 ;

//Building the initial axis
var margin = {top: 30,  bottom: 10,right: 22, left: 20};
    width = screen.width- margin.left - margin.right;
    height = 70 - margin.top - margin.bottom;
var interfaceGap = calculateInterfaceGap(zoomFactor,width);
var ticksValues = [];
var formatSeconds = d3.timeFormat("%H:%M:%S");  
var svg = d3.select("#events").append("svg")
    .attr("width", '100%')
    .attr("height",35);
svg.append("rect")
    .attr("width", "100%")
    .attr("height", 35)
    .attr("fill", "#272626");
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate("+margin.left+ "," + height + ")");


redrawAxis(simuTime);

function redrawAxis(simuTime){
        for (var i = 0; i <= 100; i++) {
          var s = (simuTime + (i - 50)*zoomFactor)*1000 - 3600000;
          ticksValues[i] =  new Date(s) ;
        }

      x = d3.scaleLinear()
          .domain([ticksValues[0] ,ticksValues[100] ])
          .range([0, width]);
      xAxis = d3.axisTop(x)
          .tickFormat(formatSeconds)
          .tickValues(ticksValues);
      svg.select(".x.axis")  
          .call(xAxis);
      //Making the ticks muliple of 10 bigger and with text
      d3.selectAll("g.tick line")
          .attr("y2", function(d,i){
             if ( (i)%10 ) 
                 return -2;
             else
                 return -6;
          });
         d3.selectAll("g.tick text")
          .style('font-size',10)
          .style("opacity", function(d,i){
             if (i%10) 
                 return 0;
          });
}
   
//Loop redrawing the axis and events when simul time changes 
function redrawEvents(simuTime) {

    leftWindowTime = calcLeftWindowTime(zoomFactor, simuTime);
    rightWindowTime = calcRightWindowTime(zoomFactor, simuTime);
    redrawAxis(simuTime);
    redrawBars(rightWindowTime,leftWindowTime);  

  //updating event data

      if (endEventsTime - rightWindowTime <= 20){
          startEventsTime = endEventsTime ;
          endEventsTime = rightWindowTime + 40 ; 
          ipcRenderer.send('loading-events-data', chekedNodes ,startEventsTime,endEventsTime,interfaceGap,0); 
      }
    removeOutdatedEvents();
  
}

function drawDashLines(height){
  for (var i = 0; i < 11; i++) {
      var x = (width/10)*i + margin.left;
      var y = 35;
      svg.append("g")
      .attr("class", "y axis dash")
      .append("line")
      .attr("class", "dash")
      .attr("transform", "translate("+ x +"," + y + ")")
      .attr("y2", height);
  }
  var x1 = (width/100)*49 + margin.left ;
  svg.append("g")
      .attr("class", "y axis dash")
      .append("line")
      .attr("class", "dash")
      .attr("transform", "translate("+ x1 +"," + y + ")")
      .attr("y2", height);
  var x2 = (width/100)*51 + margin.left ;
  svg.append("g")
      .attr("class", "y axis dash")
      .append("line")
      .attr("class", "dash")
      .attr("transform", "translate("+ x2 +"," + y + ")")
      .attr("y2", height);

  }

function calcLeftWindowTime(zoomFactor, simuTime){
    return (simuTime - 50 * zoomFactor);
}
function calcRightWindowTime(zoomFactor, simuTime){
    return (simuTime + 50 * zoomFactor);
}
function redrawBars(rightWindowTime,leftWindowTime){
    for (var j = 0; j < chekedNodes.length; j++) {
          var name = chekedNodes[j];
          var bar = svg.select('#'+name).select('.subbar').selectAll("rect").data(dataEvents[name] ,function(d) { var id = (d.Node.toString)+'_'+'_'+ (d.layer).toString()+'_'+(d.time).toString()  ;
                                                                                                                  return id; })
          bar.exit().remove();
          bar.transition()
          .duration(1)
          .attr("x",function(d){ 
              var t = d.time;
              var s = (t)*1000 - 3600000;
              return  x( new Date(s) ) + margin.left 
            })
          .attr("width", function(d){
              var barWidth = ( d.duration / 1000000000 * width ) / (100*zoomFactor) ; 
                return barWidth ; 
          })
          .style("fill",function(d){return d.color})
          bar.enter()
          .append("rect")
          .attr("height", 15)
          .attr("width", function(d){
              var barWidth = (d.duration  / 1000000000 * width)/(100*zoomFactor) ;
                return barWidth ; 
          })
          .attr("x",function(d){ 
              var t = d.time;
              var s = (t)*1000 - 3600000;
              return  x( new Date(s) ) + margin.left 
            })
          .attr('y',function(d){return d.layer *15})
          .style("fill",function(d){return d.color})  
          .on('mouseover', function(d) {
              d3.select('#foo').html( ' Time: ' + d.time + ' Duration: ' + d.duration  +  ' Class: ' + d.class);
              d3.select(this).attr('opacity', 0.5);
          })   
          .on('mouseout', function() {
              d3.select(this).attr('opacity', 1);
              d3.select('#foo').select('text').remove();     
          })  ;
    }
}


function removeOutdatedEvents(){

    for (var j = 0; j < chekedNodes.length; j++) {
      var name = chekedNodes[j];
      for (var q = 0; q < dataEvents[name].length; q++) {
          if( (dataEvents[name][q].time + dataEvents[name][q].duration / 1000000000 ) < leftWindowTime){
              dataEvents[name].splice(q,1);
          }
      }
    }
}


function calculateInterfaceGap(zoomFactor,width) {
    var fullTime = 100 * zoomFactor ;
    var interfaceGap = (fullTime * 2 ) / width ;
    return interfaceGap ;

}
