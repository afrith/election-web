var width = 500;
var height = 450;

var piewidth = 300;
var pieheight = 300;

var transDuration = 500;

var projection = d3.geo.conicEqualArea()
    .center([0, -28.5])
    .rotate([-24.5, 0])
    .parallels([-25.5, -31.5])
    .scale(1800)
    .translate([width/2, height/2]);

var path = d3.geo.path().projection(projection);

var intfmt = d3.format(",d");
var percfmt = d3.format("0.1%");
var percintfmt = d3.format("0.0%");

/*svg.append("rect").attr("class", "background")
    .attr("width", width).attr("height", height)
    .on("click", function() { goToArea("RSA"); })
    .on("mousewheel", mousewheel)
    .on("DOMMouseScroll", mousewheel);*/

var svg = d3.select("div#map").select("svg");
svg.attr("viewBox", "0 0 " + width + " " + height);
var mapg = svg.select("g#map");
var selph = mapg.select("g#selph");
var hoverph = mapg.select("g#hoverph");

var placeinfo, parties, votes;

var vtbody = d3.select("table.votes tbody");

var piesvg = d3.select("div#piechart").select("svg")
    .attr("viewBox", "0 0 " + piewidth + " " + pieheight);
var pieg = piesvg.select("g#chart").attr("transform", "translate(" + piewidth / 2 + "," + pieheight / 2 + ")");
var sliceg = pieg.select("g#slices");
var labelg = pieg.select("g#labels");

var radius = Math.min(piewidth, pieheight)/2;
var arc = d3.svg.arc().outerRadius(radius - 10).innerRadius(0);
var pie = d3.layout.pie().value(function (d) { return d.votes; });

queue()
    .defer(d3.json, "topos.json")
    .defer(d3.csv, "placeinfo.csv", function(d) {
        return { code: d.code, name: d.name, layer: +d.layer, parent: d.parent,
                winner : d.winner, valid: +d.valid, spoilt: +d.spoilt, regd: +d.regd };
    })
    .defer(d3.csv, "parties.csv")
    .defer(d3.csv, "votes.csv", function(d) {
        return { area: d.area, party: d.party, votes: +d.votes };    
    })
    .await(function (error, topos, placecsv, partycsv, votecsv) {

    placeinfo = d3.nest()
        .key(function (d) { return d.code; })
        .rollup(function (d) { return d[0]; })
        .map(placecsv);

    parties = d3.nest()
        .key(function (d) { return d.abbrev; })
        .rollup(function (d) { return d[0]; })
        .map(partycsv);

    votes = d3.nest()
        .key(function (d) { return d.area; })
        .map(votecsv);

    var areag = mapg.select("g#areas");

    natarea = areag.selectAll(".nation")
        .data(topojson.feature(topos, topos.objects.nation).features);
    natarea
        .enter().append("path")
        .attr("class", function(d) { return "nation " + d.id + " winner-" + placeinfo[d.id].winner; })
        .attr("d", path)
        /*.on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered)*/;

    provarea = areag.selectAll(".province")
        .data(topojson.feature(topos, topos.objects.provinces).features);
    provarea
        .enter().append("path")
        .attr("class", function(d) { return "province " + d.id + " winner-" + placeinfo[d.id].winner; })
        .attr("d", path)
        .on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered);
    
    distarea = areag.selectAll(".district")
        .data(topojson.feature(topos, topos.objects.districts).features);
    distarea
        .enter().append("path")
        .attr("class", function(d) { return "district " + d.id + " winner-" + placeinfo[d.id].winner; })
        .attr("d", path)
        .style("opacity", 0)
        .style("display", "none")
        .on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered);

    muniarea = areag.selectAll(".muni")
        .data(topojson.feature(topos, topos.objects.munis).features);
    muniarea
        .enter().append("path")
        .attr("class", function(d) { return "muni " + d.id + " winner-" + placeinfo[d.id].winner; })
        .attr("d", path)
        .style("opacity", 0)
        .style("display", "none")
        .on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered);

    var borderg = mapg.select("g#borders");

    munistroke = borderg.append("path")
        .datum(topojson.mesh(topos, topos.objects.munis, function (a, b){ return a !== b; }))
        .attr("class", "muni-border")
        .attr("d", path)
        .style("stroke-width", "0px").style("opacity", 0).style("display", "none")
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel);

    diststroke = borderg.append("path")
        .datum(topojson.mesh(topos, topos.objects.districts, function (a, b){ return a !== b; }))
        .attr("class", "dist-border")
        .attr("d", path)
        .style("stroke-width", "0px").style("opacity", 0).style("display", "none")
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel);

    provstroke = borderg.append("path")
        .datum(topojson.mesh(topos, topos.objects.provinces, function (a, b){ return a !== b; }))
        .attr("class", "prov-border")
        .attr("d", path)
        .style("stroke-width", "2px")
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel);

    d3.select("#wrapper").style("display", "block");
    
    if (window.location.hash !== "") {
        var h = window.location.hash.substring(1);
        if (placeinfo[h]) {
            goToArea(h);
            return;
        }
    }
    goToArea("RSA")

});

d3.select('#zoomout').on("click", function() {
    d3.event.preventDefault();
    zoomOut();
}).style("display", "none");

var curCode = "";

function zoomOut() {
    var prt = placeinfo[curCode].parent;
    if (prt) {
        goToArea(prt);
    }
}

function mousewheel(d) {
    if (d) {
        d3.event.preventDefault();
        if (d3.event.wheelDelta > 0 || d3.event.detail < 0) {
            if (d.type == "Feature") { goToArea(d.id) };
        } else {
            if (curCode !== "RSA") {
                zoomOut();
            }
        }
    }
}

function clicked(d) {
    goToArea(d.id);
}

function goToArea(code) {
    if (code == curCode) {
        return;
    }

    curCode = code;
    var d = d3.select('.' + code).datum();
    var l = placeinfo[code].layer;
    d3.select('#placename').text(placeinfo[code].name);

    unhovered();
    d3.select('#selpath').remove();
    selph.append("path")
        .datum(d)
        .attr("d", path)
        .attr("id", "selpath");

    if (l == 0) {
        mapg.transition().duration(transDuration).attr("transform", "");
        d3.select("#zoomout").style("display", "none");
    } else {
        var bds = path.bounds(d);
        var w = bds[0][0];
        var n = bds[0][1];
        var e = bds[1][0];
        var s = bds[1][1];
        var wd = e - w;
        var ht = s - n;
        var x = (w + e)/2;
        var y = (n + s)/2;
        var k = Math.min(width/wd, height/ht)*0.9;

        mapg.transition().duration(transDuration)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
        d3.select("#zoomout").style("display", "inline");
    }

    if (l == 0) {
        showProv(1, 3);
        hideDist();
        hideMuni();
    } else if (l == 1) {
        showProv(k, 4);
        showDist(k, 2, code);
        hideMuni();
    } else if (l == 2) {
        showProv(k, 6);
        showDist(k, 4, placeinfo[code].parent);
        showMuni(k, 2, code);
    } else if (l == 3) {
        showProv(k, 6);
        showDist(k, 4, placeinfo[placeinfo[code].parent].parent);
        showMuni(k, 2, placeinfo[code].parent);
    }

    // Update table
    var valid = placeinfo[code].valid;
    var spoilt = placeinfo[code].spoilt;
    var regd = placeinfo[code].regd;

    var tabsel = vtbody.selectAll("tr")
        .data(votes[code], function(d) { return d.party; });
    
    var newtr = tabsel.enter().append("tr").attr("class", function(d) { return "row-" + d.party; });
    newtr.append("td").attr("class", "partylogo")
        .append("img").attr("src", function(d) { return "images/" + d.party + ".png"; });
    newtr.append("td").text(function (d) { return parties[d.party].name; });
    newtr.append("td").attr("class", "numbercell votenum");
    newtr.append("td").attr("class", "numbercell voteperc");

    tabsel.select(".votenum").text(function (d) { return intfmt(d.votes); });
    tabsel.select(".voteperc").text(function (d) { return percfmt(d.votes/valid); });

    tabsel.exit().remove();

    tabsel.sort(function(a, b) { return d3.descending(a.votes, b.votes); });

    d3.select(".validnum").text(intfmt(valid));
    d3.select(".spoiltnum").text(intfmt(spoilt));
    d3.selectAll(".totalnum").text(intfmt(valid + spoilt));
    d3.select(".regdnum").text(intfmt(regd));
    d3.select(".turnout").text(percfmt((valid + spoilt)/regd));

    // Update pie

    var slices = sliceg.selectAll(".slice")
        .data(pie(votes[code]), function(d) { return d.data.party; });
    slices.enter().append("path")
        .attr("class", function(d) { return "slice " + d.data.party; });
    slices.attr("d", arc);

    var labels = labelg.selectAll(".pielabel")
        .data(pie(votes[code]), function(d) { return d.data.party; });
    var t = labels.enter().append("text")
        .attr("class", function(d) { return "pielabel " + d.data.party; })
        .style("text-anchor", "middle");
    t.append("tspan").attr("class", "partylabel");
    t.append("tspan").attr("class", "perclabel");

    labels
        .attr("transform", function(d) {
            var c = arc.centroid(d);
            return "translate(" + c[0]*1.5 + "," + c[1]*1.5 + ")";
        })
        .style("display", function(d) {
            return ((d.data.votes / valid) >= 0.05) ? "block" : "none";
        });
    labels.select(".partylabel").text(function(d) {
        return d.data.party;
    });
    labels.select(".perclabel").attr("x", "0").attr("dy", "1em")
    .text(function(d) {
        return percintfmt(d.data.votes/valid);
    });

    //Update URL hash
    window.location.hash = (l == 0) ? "" : ("#" + code);
};

function showProv(scale, sw) {
    provstroke.transition().duration(transDuration).style("stroke-width", (sw/scale) + "px");
}

function showDist(scale, sw, pcode) {
    distarea.style("pointer-events", function(d) {
        if ((!pcode) || (placeinfo[d.id].parent == pcode)) {
            return "auto";
        } else {
            return "none";
        }
    }).style("display", "inline");
    distarea.transition().duration(transDuration).style("opacity", 1);
    diststroke.style("display", "inline");
    diststroke.transition().duration(transDuration).style("opacity", 1).style("stroke-width", (sw/scale) + "px");
}

function showMuni(scale, sw, pcode) {
    muniarea.style("pointer-events", function(d) {
        if ((!pcode) || (placeinfo[d.id].parent == pcode)) {
            return "auto";
        } else {
            return "none";
        }
    }).style("display", "inline");

    muniarea.transition().duration(transDuration).style("opacity", 1);
    munistroke.style("display", "inline");
    munistroke.transition().duration(transDuration).style("opacity", 1).style("stroke-width", (sw/scale) + "px");
}

function hideDist() {
    distarea.transition().duration(transDuration).style("opacity", 0).each("end", function() { distarea.style("display", "none"); });
    //distarea.style("display", "none");
    diststroke.transition().duration(transDuration).style("opacity", 0).style("stroke-width", "0px").each("end", function() { diststroke.style("display", "none"); });
}

function hideMuni() {
    muniarea.transition().duration(transDuration).style("opacity", 0).each("end", function() { muniarea.style("display", "none"); });
    //muniarea.style("display", "none");
    munistroke.transition().duration(transDuration).style("opacity", 0).style("stroke-width", "0px").each("end", function() { munistroke.style("display", "none"); });

}

var hovering = false;

function hovered(d) {
    if (!hovering) {
        d3.select("#hovername").text(placeinfo[d.id].name);
        hoverph.append("path")
            .attr("d", d3.select(this).attr("d"))
            .attr("id", "hoverobj");
        hovering = true;
    }
};
function unhovered(d) {
    d3.select("#hovername").text("");
    d3.select("#hoverobj").remove();
    hovering = false;
};

