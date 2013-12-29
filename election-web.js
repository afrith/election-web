var width = 500;
var height = 450;

var transDuration = 500;

var projection = d3.geo.conicEqualArea()
    .center([0, -28.5])
    .rotate([-24.5, 0])
    .parallels([-25.5, -31.5])
    .scale(1800)
    .translate([width/2, height/2]);

var path = d3.geo.path().projection(projection);

var svg = d3.select("#map").append("svg").attr("viewBox", "0 0 " + width + " " + height);

/*svg.append("rect").attr("class", "background")
    .attr("width", width).attr("height", height)
    .on("click", function() { goToArea("RSA"); })
    .on("mousewheel", mousewheel)
    .on("DOMMouseScroll", mousewheel);*/

var mapg = svg.append("g").attr("id", "map");
var areag = mapg.append("g").attr("id", "areas");
var selph = mapg.append("g").attr("id", "selph");
var hoverph = mapg.append("g").attr("id", "hoverph");
var borderg = mapg.append("g").attr("id", "borders");

var placeinfo, parties, votes;

var vtbl, vtbody;

queue()
    .defer(d3.json, "topos.json")
    .defer(d3.csv, "placeinfo.csv", function(d) {
        return { code: d.code, name: d.name, layer: +d.layer, parent: d.parent,
                winner : d.winner, valid: +d.valid, spoilt: +d.spoilt };
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

    vtbl = d3.select("#legend").append("table").attr("class", "votes");
    var hrow = vtbl.append("tr").attr("class", "voteheader");
    hrow.append("th").attr("colspan", 2).text("Party");
    hrow.append("th").attr("class", "numbercell").text("Votes");
    //hrow.append("th").attr("class", "numbercell").text("Vote %");
    vtbody = vtbl.append("tbody");
    var srow = vtbl.append("tr").attr("class", "spoiltrow");
    srow.append("td").attr("colspan", 2).text("Spoilt votes");
    srow.append("td").attr("class", "numbercell spoiltnum");

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

    var tabsel = vtbody.selectAll("tr")
        .data(votes[code], function(d) { return d.party; });
    
    var newtr = tabsel.enter().append("tr").attr("class", function(d) { return "row-" + d.party; });
    newtr.append("td").attr("class", "partylogo")
        .append("img").attr("src", function(d) { return "images/" + d.party + ".png"; });
    newtr.append("td").text(function (d) { return parties[d.party].name; });
    newtr.append("td").attr("class", "numbercell votenum");
    //newtr.append("td").attr("class", "numbercell voteperc");

    tabsel.select(".votenum").text(function (d) { return d.votes; });

    tabsel.exit().remove();

    tabsel.sort(function(a, b) { return d3.descending(a.votes, b.votes); });

    vtbl.select(".spoiltnum").text(placeinfo[code].spoilt);
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

