var width = 500;
var height = 450;

var piewidth = 300;
var pieheight = 300;

var transDuration = 500;

var curCode = "";
var curBallot = "";

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

var svg = d3.select("div#map").select("svg");
svg.attr("viewBox", "0 0 " + width + " " + height);
var mapg = svg.select("g#map");
var selph = mapg.select("g#selph");
var hoverph = mapg.select("g#hoverph");

var vtbody = d3.select("table.votes").select("tbody");

var piesvg = d3.select("div#piechart").select("svg")
    .attr("viewBox", "0 0 " + piewidth + " " + pieheight);
var pieg = piesvg.select("g#chart").attr("transform", "translate(" + piewidth / 2 + "," + pieheight / 2 + ")");
var sliceg = pieg.select("g#slices");
var labelg = pieg.select("g#labels");

var radius = Math.min(piewidth, pieheight)/2;
var arc = d3.svg.arc().outerRadius(radius - 10).innerRadius(0);
var pie = d3.layout.pie().value(function (d) { return d.votes; });

var progarc = d3.svg.arc().outerRadius(95).innerRadius(50).startAngle(0);
var progsvg = d3.select("div#splash").select("svg");
var progmax = 451153;

var progcnt = { };
var progtot = 0;
function updateprog(c, l) {
    if (progcnt[c]) {
        progtot -= progcnt[c];
    }
    progcnt[c] = l;
    progtot += l;
    var progress = progtot/progmax;
    progsvg.select("#progbar").attr("d", progarc.endAngle(progress * 2 * Math.PI));
    progsvg.select("#progtext").text(percintfmt(progress));
}

var joba = d3.json("topos.json")
    .on("progress", function(d) {
        updateprog('t', d3.event.loaded);
    });

var jobb = d3.csv("placeinfo.csv")
    .row(function(d) {
        return { code: d.code, name: d.name, layer: +d.layer,
                    parent: d.parent, regd: +d.regd };
    })
    .on("progress", function(d) {
        updateprog('pi', d3.event.loaded);
    });

var jobc = d3.csv("placeballot.csv")
    .row(function(d) {
        return { code: d.code, ballot:d.ballot, winner : d.winner,
                    valid: +d.valid, spoilt: +d.spoilt };
    })
    .on("progress", function(d) {
        updateprog('pb', d3.event.loaded);
    });

var jobd = d3.csv("parties.csv")
    .on("progress", function(d) {
        updateprog('pt', d3.event.loaded);
    });

var jobe = d3.csv("votes.csv")
    .row(function(d) {
        return { code: d.code, ballot: d.ballot, party: d.party, votes: +d.votes };    
    })
    .on("progress", function(d) {
        updateprog('v', d3.event.loaded);
    });

queue()
    .defer(joba.get)
    .defer(jobb.get)
    .defer(jobc.get)
    .defer(jobd.get)
    .defer(jobe.get)
    .await(function (error, topos, placecsv, pbcsv, partycsv, votecsv) {

    placeinfo = d3.nest()
        .key(function (d) { return d.code; })
        .rollup(function (d) { return d[0]; })
        .map(placecsv);

    placeballot = d3.nest()
        .key(function (d) { return d.code; })
        .key(function (d) { return d.ballot; })
        .rollup(function (d) { return d[0]; })
        .map(pbcsv);

    parties = d3.nest()
        .key(function (d) { return d.abbrev; })
        .rollup(function (d) { return d[0]; })
        .map(partycsv);

    votes = d3.nest()
        .key(function (d) { return d.code; })
        .key(function (d) { return d.ballot; })
        .map(votecsv);

    var areag = mapg.select("g#areas");

    natarea = areag.selectAll(".nation")
        .data(topojson.feature(topos, topos.objects.nation).features);
    natarea
        .enter().append("path")
        .attr("class", "nation RSA")
        .attr("d", path);

    provarea = areag.selectAll(".province")
        .data(topojson.feature(topos, topos.objects.provinces).features);
    provarea
        .enter().append("path")
        .attr("class", function(d) { return "province " + d.id; })
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
        .attr("class", function(d) { return "district " + d.id; })
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
        .attr("class", function(d) { return "muni " + d.id; })
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

    d3.select("#splash").remove();
    d3.select("#wrapper").style("display", "block");

    var h = window.location.hash.substring(1).split(",");
    var b = "N";
    var c = "RSA";
    if (h[0] && (h[0] == "N" || h[0] == "P")) {
        b = h[0];
    }
    if (h[1] && (h[1] in placeinfo)) {
        c = h[1];
    }
    updateAll(b,c,true);

    d3.select(window).on("hashchange", hashchanged);

});

var hcdisable = false;
function hashchanged() {
    if (!hcdisable) {
        var h = window.location.hash.substring(1).split(",");
        var b = curBallot;
        var c = curCode;
        if (h[0] && (h[0] == "N" || h[0] == "P")) {
            b = h[0];
        }
        if (h[1] && (h[1] in placeinfo)) {
            c = h[1];
        }
        hcdisable = true;
        updateAll(b, c);
        hcdisable = false;
    }
}

function updateAll(ballot, code, firsttime) {
    if (ballot != curBallot) {
        d3.select("#switchlink")
            .text("View " + ((ballot == "N") ? "provincial legislature" : "National Assembly") + " results");
        provarea.attr("class", function(d) {
            return "province " + d.id + " winner-" + placeballot[d.id][ballot].winner;
        });

        distarea.attr("class", function(d) {
            return "district " + d.id + " winner-" + placeballot[d.id][ballot].winner;
        });

        muniarea.attr("class", function(d) {
            return "muni " + d.id + " winner-" + placeballot[d.id][ballot].winner;
        });
    }

    if (code != curCode) {
        var d = d3.select('.' + code).datum();
        var l = placeinfo[code].layer;

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
            d3.select("#zoomout")
                .style("display", "inline");
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
    }

    if ((ballot != curBallot) || (code != curCode)) {
        var hdg = d3.select(".heading");
        var hint = d3.select(".hint");
        var nhtxt = "2009 " + ((ballot == "N") ? "National Assembly" : "provincial legislature") + " election — " + placeinfo[code].name;
        if (firsttime) {
            hdg.text(nhtxt)
                .transition().duration(transDuration)
                .style("opacity", 1);
            hint.transition().duration(transDuration)
                .style("opacity", 1);
        } else {
            hdg.transition().duration(transDuration/2)
                .style("opacity", 0)
                .each("end", function() {
                    hdg.text(nhtxt)
                        .transition().duration(transDuration/2)
                        .style("opacity", 1);
                });
            hint.transition().duration(transDuration)
                .style("opacity", 0)
                .each("end", function() { hint.remove(); });
        }

        d3.select('title').text("2009 " + ((ballot == "N") ? "National Assembly" : "provincial legislature") + " election — " + placeinfo[code].name);
        d3.select("#switchlink")
            .attr("href", "#" + ((ballot == "N") ? "P" : "N") + "," + code);
        d3.select("#zoomout")
            .attr("href", "#" + ballot + "," + placeinfo[code].parent);

        // Update table
        var valid = placeballot[code][ballot].valid;
        var spoilt = placeballot[code][ballot].spoilt;
        var regd = placeinfo[code].regd;

        var fadetables = d3.selectAll("table.fadetable");

        fadetables.transition().duration(transDuration/2)
            .style("opacity", 0)
            .each("end", function() {

                var tabsel = vtbody.selectAll("tr")
                    .data(votes[code][ballot], function(d) { return d.party; });

                var newtr = tabsel.enter()
                    .append("tr")
                    .attr("class", function(d) { return "row-" + d.party; });
                newtr.append("td").attr("class", "partylogo")
                    .append("img").attr("src", function(d) { return "images/" + d.party + ".png"; });
                newtr.append("td").text(function (d) { return parties[d.party].name; });
                newtr.append("td").attr("class", "numbercell votenum");
                newtr.append("td").attr("class", "numbercell voteperc");

                tabsel.exit().remove();

                tabsel.sort(function(a, b) { return d3.descending(a.votes, b.votes); });
                tabsel.select(".votenum").text(function (d) { return intfmt(d.votes); });
                tabsel.select(".voteperc").text(function (d) { return percfmt(d.votes/valid); });

                d3.select(".validnum").text(intfmt(valid));
                d3.select(".spoiltnum").text(intfmt(spoilt));
                d3.selectAll(".totalnum").text(intfmt(valid + spoilt));
                d3.select(".regdnum").text(intfmt(regd));
                d3.select(".turnout").text(percfmt((valid + spoilt)/regd));

                fadetables.transition().duration(transDuration/2)
                    .style("opacity", 1);
            });

        // Update pie
        var datafilt = votes[code][ballot].filter(function(d) { return d.votes > 0; });

        var slices = sliceg.selectAll(".slice")
            .data(pie(datafilt), function(d) { return d.data.party; });
        slices.enter().append("path")
            .attr("class", function(d) { return "slice " + d.data.party; })
            .each(function(d) {
                this._curang = {data: d.data, value: d.value, startAngle: d.startAngle, endAngle: d.startAngle};
            });
        slices
            .transition().duration(transDuration)
            .attrTween("d", function(a) {
                var i = d3.interpolate(this._curang, a);
                this._curang = i(0);
                return function(t) {
                    return arc(i(t));
                };
            });
        slices.exit().remove();

        var labels = labelg.selectAll(".pielabel")
            .data(pie(datafilt), function(d) { return d.data.party; });
        var t = labels.enter().append("text")
            .attr("class", function(d) { return "pielabel " + d.data.party; })
            .style("text-anchor", "middle");
        t.append("tspan").attr("class", "partylabel");
        t.append("tspan").attr("class", "perclabel");

        labels
            .style("display", function(d) {
                return ((d.data.votes / valid) >= 0.05) ? "block" : "none";
            })
            .transition().duration(transDuration)
            .attr("transform", function(d) {
                var c = arc.centroid(d);
                return "translate(" + c[0]*1.5 + "," + c[1]*1.5 + ")";
            });
        labels.select(".partylabel").text(function(d) {
            return d.data.party;
        });
        labels.select(".perclabel").attr("x", "0").attr("dy", "1em")
        .transition().duration(transDuration)
            .tween("text", function(d) {
                var i = d3.interpolateNumber(
                    (this.textContent == "") ? 0 : parseInt(this.textContent)/100,
                    d.data.votes/valid);
                return function(t) {
                    this.textContent = percintfmt(i(t));
                };
            });
        labels.exit().remove();

        //Update URL hash
        window.location.hash = "#" + ballot + "," + code;
    }

    curBallot = ballot;
    curCode = code;
}

d3.select("#switchlink").on("click", function() {
    d3.event.preventDefault();
    if (curBallot == "N") {
        updateAll("P", curCode);
    } else {
        updateAll("N", curCode);
    }
});

d3.select('#zoomout').on("click", function() {
    d3.event.preventDefault();
    zoomOut();
}).style("display", "none");

function zoomOut() {
    var prt = placeinfo[curCode].parent;
    if (prt) {
        updateAll(curBallot, prt);
    }
}

function mousewheel(d) {
    if (d) {
        d3.event.preventDefault();
        if (d3.event.wheelDelta > 0 || d3.event.detail < 0) {
            if (d.type == "Feature") { updateAll(curBallot, d.id) };
        } else {
            if (curCode !== "RSA") {
                zoomOut();
            }
        }
    }
}

function clicked(d) {
    updateAll(curBallot, d.id);
}

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
    distarea.style("pointer-events", "none");
    distarea.transition().duration(transDuration).style("opacity", 0).each("end", function() { distarea.style("display", "none"); });
    diststroke.transition().duration(transDuration).style("opacity", 0).style("stroke-width", "0px").each("end", function() { diststroke.style("display", "none"); });
}

function hideMuni() {
    muniarea.style("pointer-events", "none");
    muniarea.transition().duration(transDuration).style("opacity", 0).each("end", function() { muniarea.style("display", "none"); });
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

