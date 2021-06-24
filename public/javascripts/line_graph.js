const boroughDropDown = null;

export const nycLineGraph = () =>
  d3
    .csv(
      "https://gist.githubusercontent.com/will-ku/87dc16f167af2d117ada33035c425d17/raw/08c396370ad39588f38fd6c79f6b1252d4def2e6/medianSalesPrice_All.csv"
    )
    .then((allData) => {
      let data = new Array();
      let nycPriceRange;
      // define variable for what I'm interested in
      let nycPrices;

      // find a particular object aka neighborhood or area (ex: just NYC)
      for (let i = 0; i < allData.length; i++) {
        if (allData[i].areaName === "NYC") nycPrices = allData[i];
      }

      // removing extra k-v pairs that won't be shown on the line graph
      delete nycPrices["areaName"];
      delete nycPrices["Borough"];
      delete nycPrices["areaType"];

      // building data object
      data = Object.entries(nycPrices).map((entry) => {
        return {
          date: new Date(entry[0].replace(/-/g, "/")),
          value: parseInt(entry[1]),
        };
      });
      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      const height = 600;
      const width = 600;

      const bisect = function (mx) {
        const bisect = d3.bisector((d) => d.date).left;
        const date = x.invert(mx);
        const index = bisect(data, date, 1);
        const a = data[index - 1];
        const b = data[index];
        return b && date - a.date > b.date - date ? b : a;
      };

      // function bisect() {
      //   const bisect = d3.bisector((d) => d.date).left;
      //   // debugger;
      //   return (mx) => {
      //     // debugger;
      //     const date = x.invert(mx);
      //     const index = bisect(data, date, 1);
      //     const a = data[index - 1];
      //     const b = data[index];
      //     return b && date - a.date > b.date - date ? b : a;
      //   };
      // }

      function formatDate(date) {
        return date.toLocaleString("en", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        });
      }

      function formatValue(value) {
        return value.toLocaleString("en", {
          style: "currency",
          currency: "USD",
        });
      }

      function callout(g, value) {
        if (!value) return g.style("display", "none");

        g.style("display", null)
          .style("pointer-events", "none")
          .style("font", "10px sans-serif");

        const path = g
          .selectAll("path")
          .data([null])
          .join("path")
          .attr("fill", "white")
          .attr("stroke", "black");

        const text = g
          .selectAll("text")
          .data([null])
          .join("text")
          .call((text) =>
            text
              .selectAll("tspan")
              .data((value + "").split(/\n/))
              .join("tspan")
              .attr("x", 0)
              .attr("y", (d, i) => `${i * 1.1}em`)
              .style("font-weight", (_, i) => (i ? null : "bold"))
              .text((d) => d)
          );

        const { x, y, width: w, height: h } = text.node().getBBox();

        text.attr("transform", `translate(${-w / 2},${15 - y})`);
        path.attr(
          "d",
          `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`
        );
      }

      const xAxis = (g) =>
        g.attr("transform", `translate(0,${height - margin.bottom})`).call(
          d3
            .axisBottom(x)
            .ticks(width / 50)
            .tickSizeOuter(2)
        );

      const yAxis = (g) =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call((g) => g.select(".domain").remove())
          .call((g) =>
            g
              .select(".tick:last-of-type text")
              .clone()
              .attr("x", 3)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .text(data.y)
          );

      const x = d3
        .scaleUtc()
        .domain(d3.extent(data, (d) => d.date))
        .range([margin.left, width - margin.right]);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value)])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const line = d3
        .line()
        .defined((d) => !isNaN(d.value))
        .x((d) => x(d.date))
        .y((d) => y(d.value));

      function chart() {
        const svg = d3
          .select(".line-graph")
          .append("svg")
          .attr("viewBox", [0, 0, width, height]);

        svg.append("g").call(xAxis);
        svg.append("g").call(yAxis);
        svg
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", "steelblue")
          .attr("stroke-width", 1.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-lincap", "round")
          .attr("d", line);

        const tooltip = svg.append("g");

        svg.on("touchmove mousemove", function (event) {
          const { date, value } = bisect(d3.pointer(event, this)[0]);
          // debugger;
          tooltip.attr("transform", `translate(${x(date)},${y(value)})`).call(
            callout,
            `${formatValue(value)}
${formatDate(date)}`
          );
        });

        svg.on("touchend mouseleave", () => tooltip.call(callout, null));

        return svg.node();
      }
      chart();
    });