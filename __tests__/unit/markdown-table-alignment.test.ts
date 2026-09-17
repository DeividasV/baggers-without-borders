import React from "react";
import { render, screen } from "@testing-library/react";
import {
  applyMarkdownTableColumnAlignment,
  inferMarkdownTableColumnKindsFromRows,
} from "@/src/lib/markdown-table-alignment";

type TaggedCellProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  align?: string;
};

function TaggedHeaderCell({ children, className, style, align }: TaggedCellProps) {
  return React.createElement("th", { className, style, align }, children);
}

function TaggedBodyCell({ children, className, style, align }: TaggedCellProps) {
  return React.createElement("td", { className, style, align }, children);
}

(TaggedHeaderCell as typeof TaggedHeaderCell & { __bwbMarkdownTag?: "th" }).__bwbMarkdownTag = "th";
(TaggedBodyCell as typeof TaggedBodyCell & { __bwbMarkdownTag?: "td" }).__bwbMarkdownTag = "td";

describe("markdown table alignment inference", () => {
  it("keeps text columns left-aligned while shrinking numeric columns", () => {
    expect(
      inferMarkdownTableColumnKindsFromRows([
        {
          isHeader: true,
          cells: ["Prominence Category", "Total peaks in year", "Name", "Year"],
        },
        {
          isHeader: false,
          cells: ["P100m", "389", "Brian Kalet", "2020"],
        },
        {
          isHeader: false,
          cells: ["P1500m", "64", "Demo Climber", "2023"],
        },
      ])
    ).toEqual(["text", "number", "text", "year"]);
  });

  it("treats comma-formatted totals as numeric columns", () => {
    expect(
      inferMarkdownTableColumnKindsFromRows([
        {
          isHeader: true,
          cells: ["Category", "Total", "Known Completions", "Name", "Year"],
        },
        {
          isHeader: false,
          cells: ["All Mainland Ireland and Wales", "2,694", "1", "Fergal Hingerty", "2024"],
        },
        {
          isHeader: false,
          cells: ["High Hills of Britain", "1,035", "2", "Sample Climber", "2024"],
        },
      ])
    ).toEqual(["text", "number", "number", "text", "year"]);
  });

  it("does not force alignment changes for descriptive columns", () => {
    expect(
      inferMarkdownTableColumnKindsFromRows([
        {
          isHeader: true,
          cells: ["Name", "Description"],
        },
        {
          isHeader: false,
          cells: ["Petter Bjorstad", "DIY/un-guided e.g. Gunnbjornfjeld 2004, Denali 2006"],
        },
      ])
    ).toEqual(["text", "text"]);
  });

  it("lets explicit alignment markers override inferred alignment", () => {
    const alignedTableContent = applyMarkdownTableColumnAlignment(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("th", { align: "left" }, "Name"),
            React.createElement("th", { align: "right" }, "Total"),
            React.createElement("th", { align: "center" }, "Status")
          )
        ),
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("td", { align: "left" }, "Brian"),
            React.createElement("td", { align: "right" }, "389"),
            React.createElement("td", { align: "center" }, "Open")
          )
        )
      )
    );

    render(React.createElement("table", null, alignedTableContent));

    expect(screen.getByText("Name").closest("th")).toHaveClass("text-left");
    expect(screen.getByText("Total").closest("th")).toHaveClass("text-right");
    expect(screen.getByText("Status").closest("th")).toHaveClass("text-center");
    expect(screen.getByText("Open").closest("td")).toHaveClass("text-center");
  });

  it("supports width directives in header cells and strips them from display text", () => {
    const alignedTableContent = applyMarkdownTableColumnAlignment(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("th", null, "Name {w:18rem}"),
            React.createElement("th", null, "Total {w:fit}"),
            React.createElement("th", null, "Year {w:7ch}")
          )
        ),
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("td", null, "Demo Climber"),
            React.createElement("td", null, "389"),
            React.createElement("td", null, "2023")
          )
        )
      )
    );

    render(React.createElement("table", null, alignedTableContent));

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByText(/\{w:/)).not.toBeInTheDocument();
    expect(screen.getByText("Name").closest("th")).toHaveStyle({
      width: "18rem",
      minWidth: "18rem",
    });
    expect(screen.getByText("Total").closest("th")).toHaveStyle({
      width: "1%",
      whiteSpace: "nowrap",
    });
    expect(screen.getByText("Year").closest("th")).toHaveStyle({ width: "7ch", minWidth: "7ch" });
    expect(screen.getByText("389").closest("td")).toHaveStyle({
      width: "1%",
      whiteSpace: "nowrap",
    });
  });

  it("ignores zero-width directives and removes the token from the label", () => {
    const alignedTableContent = applyMarkdownTableColumnAlignment(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("th", null, "Name {w:0px}"),
            React.createElement("th", null, "Total")
          )
        ),
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement("td", null, "Brian"),
            React.createElement("td", null, "389")
          )
        )
      )
    );

    render(React.createElement("table", null, alignedTableContent));

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByText(/\{w:0px\}/)).not.toBeInTheDocument();
    expect(screen.getByText("Name").closest("th")).not.toHaveStyle({ width: "0px" });
  });

  it("supports tagged custom header and cell renderers used by MarkdownViewer", () => {
    const alignedTableContent = applyMarkdownTableColumnAlignment(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(TaggedHeaderCell, null, "Name {w:18rem}"),
            React.createElement(TaggedHeaderCell, null, "Total {w:fit}"),
            React.createElement(TaggedHeaderCell, null, "Year {w:7ch}")
          )
        ),
        React.createElement(
          "tbody",
          null,
          React.createElement(
            "tr",
            null,
            React.createElement(TaggedBodyCell, null, "Brian Kalet"),
            React.createElement(TaggedBodyCell, null, "389"),
            React.createElement(TaggedBodyCell, null, "2020")
          )
        )
      )
    );

    render(React.createElement("table", null, alignedTableContent));

    expect(screen.queryByText(/\{w:/)).not.toBeInTheDocument();
    expect(screen.getByText("Name").closest("th")).toHaveStyle({
      width: "18rem",
      minWidth: "18rem",
    });
    expect(screen.getByText("Total").closest("th")).toHaveStyle({
      width: "1%",
      whiteSpace: "nowrap",
    });
    expect(screen.getByText("Year").closest("th")).toHaveStyle({
      width: "7ch",
      minWidth: "7ch",
    });
    expect(screen.getByText("389").closest("td")).toHaveClass("text-right");
  });
});
