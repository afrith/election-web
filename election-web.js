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

var g = svg.append("g");
var hoverph, selph;
   
d3.json("muni.json", function(error, muni) {
    natarea = g.selectAll(".nation")
        .data(topojson.feature(muni, muni.objects.nation).features);
    natarea
        .enter().append("path")
        .attr("class", function(d) { return "nation " + d.id + " winner-" + muniinfo[d.id].winner; })
        .attr("d", path)
        /*.on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered)*/;

    provarea = g.selectAll(".province")
        .data(topojson.feature(muni, muni.objects.provinces).features);
    provarea
        .enter().append("path")
        .attr("class", function(d) { return "province " + d.id + " winner-" + muniinfo[d.id].winner; })
        .attr("d", path)
        .on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered);
    
    distarea = g.selectAll(".district")
        .data(topojson.feature(muni, muni.objects.districts).features);
    distarea
        .enter().append("path")
        .attr("class", function(d) { return "district " + d.id + " winner-" + muniinfo[d.id].winner; })
        .attr("d", path)
        //.style("opacity", 0)
        .style("display", "none")
        .on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered);

    muniarea = g.selectAll(".muni")
        .data(topojson.feature(muni, muni.objects.munis).features);
    muniarea
        .enter().append("path")
        .attr("class", function(d) { return "muni " + d.id + " winner-" + muniinfo[d.id].winner; })
        .attr("d", path)
        //.style("opacity", 0)
        .style("display", "none")
        .on("click", clicked)
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel)
        .on("mousemove", hovered)
        .on("mouseout", unhovered);

    selph = g.append("g").attr("id", "selph");
    hoverph = g.append("g").attr("id", "hoverph");

    munistroke = g.append("path")
        .datum(topojson.mesh(muni, muni.objects.munis, function (a, b){ return a !== b; }))
        .attr("class", "muni-border")
        .attr("d", path)
        .style("stroke-width", "0px").style("opacity", 0).style("display", "none")
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel);

    diststroke = g.append("path")
        .datum(topojson.mesh(muni, muni.objects.districts, function (a, b){ return a !== b; }))
        .attr("class", "dist-border")
        .attr("d", path)
        .style("stroke-width", "0px").style("opacity", 0).style("display", "none")
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel);

    provstroke = g.append("path")
        .datum(topojson.mesh(muni, muni.objects.provinces, function (a, b){ return a !== b; }))
        .attr("class", "prov-border")
        .attr("d", path)
        .style("stroke-width", "2px")
        .on("mousewheel", mousewheel)
        .on("DOMMouseScroll", mousewheel);

    goToArea("RSA")
});

d3.select('#zoomout').on("click", function() {
    d3.event.preventDefault();
    zoomOut();
}).style("display", "none");

var curCode = "RSA";

function zoomOut() {
    var prt = muniinfo[curCode].parent;
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
    var l = muniinfo[code].layer;
    d3.select('#placename').text(muniinfo[code].name);

    unhovered();
    d3.select('#selpath').remove();
    selph.append("path")
        .datum(d)
        .attr("d", path)
        .attr("id", "selpath");

    if (l == 0) {
        g.transition().duration(transDuration).attr("transform", "");
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

        g.transition().duration(transDuration)
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
        showDist(k, 4, muniinfo[code].parent);
        showMuni(k, 2, code);
    } else if (l == 3) {
        showProv(k, 6);
        showDist(k, 4, muniinfo[muniinfo[code].parent].parent);
        showMuni(k, 2, muniinfo[code].parent);
    }
};

function showProv(scale, sw) {
    provstroke.transition().duration(transDuration).style("stroke-width", (sw/scale) + "px");
}

function showDist(scale, sw, pcode) {
    distarea.style("pointer-events", function(d) {
        if ((!pcode) || (muniinfo[d.id].parent == pcode)) {
            return "auto";
        } else {
            return "none";
        }
    }).style("display", "inline");
    //distarea.transition().duration(transDuration).style("opacity", 1);
    diststroke.style("display", "inline");
    diststroke.transition().duration(transDuration).style("opacity", 1).style("stroke-width", (sw/scale) + "px");
}

function showMuni(scale, sw, pcode) {
    muniarea.style("pointer-events", function(d) {
        if ((!pcode) || (muniinfo[d.id].parent == pcode)) {
            return "auto";
        } else {
            return "none";
        }
    }).style("display", "inline");

    //muniarea.transition().duration(transDuration).style("opacity", 1);
    munistroke.style("display", "inline");
    munistroke.transition().duration(transDuration).style("opacity", 1).style("stroke-width", (sw/scale) + "px");
}

function hideDist() {
    //distarea.transition().duration(transDuration).style("opacity", 0).each("end", function() { distarea.style("display", "none"); });
    distarea.style("display", "none");
    diststroke.transition().duration(transDuration).style("opacity", 0).style("stroke-width", "0px").each("end", function() { diststroke.style("display", "none"); });
}

function hideMuni() {
    //muniarea.transition().duration(transDuration).style("opacity", 0).each("end", function() { muniarea.style("display", "none"); });
    muniarea.style("display", "none");
    munistroke.transition().duration(transDuration).style("opacity", 0).style("stroke-width", "0px").each("end", function() { munistroke.style("display", "none"); });

}

var hovering = false;

function hovered(d) {
    if (!hovering) {
        d3.select("#hovername").text(muniinfo[d.id].name);
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

