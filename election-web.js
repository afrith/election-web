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

svg.append("rect").attr("class", "background")
    .attr("width", width).attr("height", height)
    .on("click", resetNation);

var g = svg.append("g");
var hoverph;
   
d3.json("muni.json", function(error, muni) {
    var provs = topojson.feature(muni, muni.objects.provinces);
    provarea = g.selectAll(".province")
        .data(provs.features);
    provarea
        .enter().append("path")
        .attr("class", function(d) { return "province " + d.id; })
        .attr("d", path)
        .on("click", clicked)
        .on("mouseover", hovered)
        .on("mouseout", unhovered);
    
    distarea = g.selectAll(".district")
        .data(topojson.feature(muni, muni.objects.districts).features);
    distarea
        .enter().append("path")
        .attr("class", function(d) { return "district " + d.id; })
        .attr("d", path)
        //.style("opacity", 0)
        .style("display", "none")
        .on("click", clicked)
        .on("mouseover", hovered)
        .on("mouseout", unhovered);

    muniarea = g.selectAll(".muni")
        .data(topojson.feature(muni, muni.objects.munis).features);
    muniarea
        .enter().append("path")
        .attr("class", function(d) { return "muni " + d.id; })
        .attr("d", path)
        //.style("opacity", 0)
        .style("display", "none")
        .on("click", clicked)
        .on("mouseover", hovered)
        .on("mouseout", unhovered);

    hoverph = g.append("g").attr("id", "hoverph");

    munistroke = g.append("path")
        .datum(topojson.mesh(muni, muni.objects.munis, function (a, b){ return a !== b; }))
        .attr("class", "muni-border")
        .attr("d", path)
        .style("stroke-width", "0px").style("opacity", 0).style("display", "none");

    diststroke = g.append("path")
        .datum(topojson.mesh(muni, muni.objects.districts, function (a, b){ return a !== b; }))
        .attr("class", "dist-border")
        .attr("d", path)
        .style("stroke-width", "0px").style("opacity", 0).style("display", "none");

    provstroke = g.append("path")
        .datum(topojson.mesh(muni, muni.objects.provinces, function (a, b){ return a !== b; }))
        .attr("class", "prov-border")
        .attr("d", path)
        .style("stroke-width", "2px");
   
    
});

/*$('#reseta').click(function(e) {
    e.preventDefault();
    resetNation();
});*/

$('#zoomout').click(function(e) {
    e.preventDefault();
    if (curCode != '') {
        var prt = muniinfo[curCode].parent;
        if (prt) {
            goToArea(prt);
        } else {
            resetNation();
        }
    }
});
$('#zoomout').css("display", "none");

function clicked(d) {
    goToArea(d.id);
}

var curCode = '';

function goToArea(code) {
    curCode = code;
    var d = d3.select('.' + code).datum();
    var l = muniinfo[code].layer;
    $('#placename').text(muniinfo[code].name);

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

    if (l == 1) {
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

    $("#zoomout").css("display", "inline");
};

function resetNation() {
    curCode = '';
    $('#placename').text("South Africa");

    g.transition().duration(transDuration).attr("transform", "");
    showProv(1, 3);
    hideDist();
    hideMuni();
    $('#zoomout').css("display", "none");
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

function hovered(d) {
    $("#hovername").text(muniinfo[d.id].name);
    hoverph.append("path")
        .attr("d", d3.select(this).attr("d"))
        .attr("id", "hoverobj");
};
function unhovered(d) {
    $("#hovername").text("");
    d3.select("#hoverobj").remove();
};

