// Load the data
const iris = d3.csv("iris.csv");

// Scatter Plot - Petal Length vs Petal Width
iris.then(function (data) {
  // Convert string values to numbers
  data.forEach(function (d) {
    d.PetalLength = +d.PetalLength;
    d.PetalWidth = +d.PetalWidth;
  });

  // Define the dimensions and margins for the SVG
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create the SVG container
  const svg = d3
    .select("#scatterplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales for x and y axes
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.PetalLength))
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.PetalWidth))
    .range([height, 0]);

  // Color scale for species
  const colorScale = d3
    .scaleOrdinal()
    .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
    .range(d3.schemeCategory10);

  // Add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  // Add y-axis
  svg.append("g").call(d3.axisLeft(yScale));

  // Add circles for each data point
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.PetalLength))
    .attr("cy", (d) => yScale(d.PetalWidth))
    .attr("r", 5)
    .attr("fill", (d) => colorScale(d.Species));

  // Add x-axis label
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Petal Length");

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Petal Width");

  // Add legend
  const legend = svg
    .selectAll(".legend")
    .data(colorScale.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  // Add colored rectangles
  legend
    .append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", colorScale);

  // Add species names
  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text((d) => d);
});

// Boxplot - Petal Length by Species
iris.then(function (data) {
  // Convert string values to numbers
  data.forEach(function (d) {
    d.PetalLength = +d.PetalLength;
  });

  // Define the dimensions and margins for the SVG
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create the SVG container
  const svg = d3
    .select("#boxplot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales for x and y axes
  const species = Array.from(new Set(data.map((d) => d.Species)));
  const xScale = d3
    .scaleBand()
    .domain(species)
    .range([0, width])
    .paddingInner(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.PetalLength)])
    .range([height, 0]);

  // Add x-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  // Add y-axis
  svg.append("g").call(d3.axisLeft(yScale));

  // Add x-axis label
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Species");

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Petal Length");

  // Calculate quartiles for each species
  const rollupFunction = function (groupData) {
    const values = groupData.map((d) => d.PetalLength).sort(d3.ascending);
    const q1 = d3.quantile(values, 0.25);
    const median = d3.quantile(values, 0.5);
    const q3 = d3.quantile(values, 0.75);
    const iqr = q3 - q1;
    const min = q1 - 1.5 * iqr;
    const max = q3 + 1.5 * iqr;
    return { q1, median, q3, iqr, min, max };
  };

  const quartilesBySpecies = d3.rollup(data, rollupFunction, (d) => d.Species);

  // Draw boxplots
  quartilesBySpecies.forEach((quartiles, Species) => {
    const x = xScale(Species);
    const boxWidth = xScale.bandwidth();

    // Draw vertical lines (whiskers)
    svg
      .append("line")
      .attr("x1", x + boxWidth / 2)
      .attr("x2", x + boxWidth / 2)
      .attr("y1", yScale(quartiles.min))
      .attr("y2", yScale(quartiles.max))
      .attr("stroke", "black");

    // Draw box (rectangle from q1 to q3)
    svg
      .append("rect")
      .attr("x", x)
      .attr("y", yScale(quartiles.q3))
      .attr("width", boxWidth)
      .attr("height", yScale(quartiles.q1) - yScale(quartiles.q3))
      .attr("fill", "#ccc")
      .attr("stroke", "black");

    // Draw median line
    svg
      .append("line")
      .attr("x1", x)
      .attr("x2", x + boxWidth)
      .attr("y1", yScale(quartiles.median))
      .attr("y2", yScale(quartiles.median))
      .attr("stroke", "black");
  });
});
