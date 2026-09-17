import { Children, cloneElement, isValidElement, type ReactNode } from "react";

export type MarkdownTableColumnKind = "text" | "number" | "year";
type MarkdownTableExplicitAlignment = "left" | "center" | "right" | undefined;
type MarkdownTableColumnWidth = string | undefined;

type TableRowSnapshot = {
  isHeader: boolean;
  cells: string[];
};

type MarkdownTableHeaderDirective = {
  width?: MarkdownTableColumnWidth;
  label: string;
};

type TaggedMarkdownTableElement = {
  __bwbMarkdownTag?: "th" | "td";
};

const YEAR_HEADER_PATTERN = /\b(year|date)\b/i;
const NUMBER_HEADER_PATTERN =
  /\b(total|listed|known|count|number|qty|quantity|amount|value|rank|summits?|peaks?|completions?)\b/i;
const WIDTH_TOKEN_PATTERN = /\{w(?:idth)?:\s*([^}]+)\}/gi;
const SUPPORTED_WIDTH_PATTERN = /^(auto|fit|\d+(?:\.\d+)?(?:px|rem|em|ch|%))$/i;

function normalizeSupportedWidthToken(value: string): MarkdownTableColumnWidth {
  const normalized = value.trim().toLowerCase();
  if (!SUPPORTED_WIDTH_PATTERN.test(normalized)) {
    return undefined;
  }

  const numericMatch = normalized.match(/^(\d+(?:\.\d+)?)/);
  if (numericMatch && parseFloat(numericMatch[1]) <= 0) {
    return undefined;
  }

  return normalized;
}

function parseHeaderDirectives(value: string): MarkdownTableHeaderDirective {
  let width: MarkdownTableColumnWidth;

  const label = value
    .replace(WIDTH_TOKEN_PATTERN, (_, rawWidth: string) => {
      width = normalizeSupportedWidthToken(rawWidth) ?? width;
      return "";
    })
    .replace(/\s+/g, " ")
    .trim();

  return {
    width,
    label,
  };
}

function normalizeCellText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[\u2020\u2021*]+$/g, "")
    .trim();
}

function compactNumericValue(value: string): string {
  return normalizeCellText(value).replace(/,/g, "").replace(/\s+/g, "");
}

function isYearValue(value: string): boolean {
  return /^(19|20)\d{2}$/.test(compactNumericValue(value));
}

function isNumericValue(value: string): boolean {
  return /^[+-]?\d+(\.\d+)?%?$/.test(compactNumericValue(value));
}

function getTruthyMatchRatio(values: string[], predicate: (value: string) => boolean): number {
  if (values.length === 0) return 0;
  const matches = values.filter(predicate).length;
  return matches / values.length;
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractTextContent).join(" ");
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return "";
  }

  return extractTextContent(node.props.children);
}

function getNodeTableElementType(node: ReactNode): string | undefined {
  if (!isValidElement(node)) {
    return undefined;
  }

  if (typeof node.type === "string") {
    return node.type;
  }

  return (node.type as TaggedMarkdownTableElement).__bwbMarkdownTag;
}

function collectTableRows(
  node: ReactNode,
  rows: TableRowSnapshot[] = [],
  isHeaderSection = false
): TableRowSnapshot[] {
  Children.forEach(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) {
      return;
    }

    const elementType = getNodeTableElementType(child);

    if (!elementType) {
      collectTableRows(child.props.children, rows, isHeaderSection);
      return;
    }

    if (elementType === "thead") {
      collectTableRows(child.props.children, rows, true);
      return;
    }

    if (elementType === "tbody" || elementType === "tfoot") {
      collectTableRows(child.props.children, rows, false);
      return;
    }

    if (elementType === "tr") {
      const cells = Children.toArray(child.props.children)
        .filter(
          (cell): cell is React.ReactElement<{ children?: ReactNode }> =>
            isValidElement<{ children?: ReactNode }>(cell) &&
            (getNodeTableElementType(cell) === "th" || getNodeTableElementType(cell) === "td")
        )
        .map((cell) => {
          const content = normalizeCellText(extractTextContent(cell.props.children));
          return getNodeTableElementType(cell) === "th"
            ? parseHeaderDirectives(content).label
            : content;
        });

      if (cells.length > 0) {
        rows.push({ isHeader: isHeaderSection, cells });
      }

      return;
    }

    collectTableRows(child.props.children, rows, isHeaderSection);
  });

  return rows;
}

function collectColumnWidths(node: ReactNode): MarkdownTableColumnWidth[] {
  const widths: MarkdownTableColumnWidth[] = [];
  let foundHeaderRow = false;

  Children.forEach(node, (child) => {
    if (foundHeaderRow || !isValidElement<{ children?: ReactNode }>(child)) {
      return;
    }

    const elementType = getNodeTableElementType(child);

    if (!elementType) {
      const nestedWidths = collectColumnWidths(child.props.children);
      if (nestedWidths.length > 0) {
        nestedWidths.forEach((width, index) => {
          widths[index] = width;
        });
        foundHeaderRow = true;
      }
      return;
    }

    if (elementType === "thead") {
      const nestedWidths = collectColumnWidths(child.props.children);
      if (nestedWidths.length > 0) {
        nestedWidths.forEach((width, index) => {
          widths[index] = width;
        });
        foundHeaderRow = true;
      }
      return;
    }

    if (elementType !== "tr") {
      const nestedWidths = collectColumnWidths(child.props.children);
      if (nestedWidths.length > 0) {
        nestedWidths.forEach((width, index) => {
          widths[index] = width;
        });
      }
      return;
    }

    Children.forEach(child.props.children, (cell, columnIndex) => {
      if (
        !isValidElement<{ children?: ReactNode }>(cell) ||
        getNodeTableElementType(cell) !== "th"
      ) {
        return;
      }

      const headerDirective = parseHeaderDirectives(extractTextContent(cell.props.children));
      widths[columnIndex] = headerDirective.width;
    });

    foundHeaderRow = true;
  });

  return widths;
}

function stripWidthTokensFromNode(node: ReactNode): ReactNode {
  if (typeof node === "string") {
    return parseHeaderDirectives(node).label;
  }

  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const strippedChild = stripWidthTokensFromNode(child);
      if (isValidElement(strippedChild) && strippedChild.key == null) {
        return cloneElement(strippedChild, { key: index });
      }
      return strippedChild;
    });
  }

  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return node;
  }

  return cloneElement(node, {
    children: stripWidthTokensFromNode(node.props.children),
  });
}

export function inferMarkdownTableColumnKindsFromRows(
  rows: Array<{ isHeader: boolean; cells: string[] }>
): MarkdownTableColumnKind[] {
  if (rows.length === 0) {
    return [];
  }

  const headerRow = rows.find((row) => row.isHeader) ?? rows[0];
  const bodyRows = rows.filter((row) => !row.isHeader);
  const columnCount = Math.max(...rows.map((row) => row.cells.length));

  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const headerText = normalizeCellText(headerRow.cells[columnIndex] ?? "");
    const values = bodyRows
      .map((row) => normalizeCellText(row.cells[columnIndex] ?? ""))
      .filter(Boolean);
    const hasYearHint = YEAR_HEADER_PATTERN.test(headerText);
    const hasNumericHint = NUMBER_HEADER_PATTERN.test(headerText);

    if ((hasYearHint && !hasNumericHint) || getTruthyMatchRatio(values, isYearValue) >= 0.75) {
      return "year";
    }

    if (hasNumericHint || getTruthyMatchRatio(values, isNumericValue) >= 0.75) {
      return "number";
    }

    return "text";
  });
}

function getExplicitAlignmentClassName(alignment: MarkdownTableExplicitAlignment): string | null {
  switch (alignment) {
    case "left":
      return "text-left";
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return null;
  }
}

function getColumnAlignmentClassName(
  columnKind: MarkdownTableColumnKind,
  explicitAlignment?: MarkdownTableExplicitAlignment
): string {
  const explicitAlignmentClassName = getExplicitAlignmentClassName(explicitAlignment);

  if (explicitAlignmentClassName) {
    return explicitAlignmentClassName;
  }

  switch (columnKind) {
    case "year":
      return "w-[1%] whitespace-nowrap text-right tabular-nums";
    case "number":
      return "w-[1%] whitespace-nowrap text-right tabular-nums";
    case "text":
    default:
      return "text-left";
  }
}

function getColumnWidthStyle(width: MarkdownTableColumnWidth): Record<string, string> | undefined {
  if (!width) {
    return undefined;
  }

  if (width === "fit") {
    return {
      width: "1%",
      whiteSpace: "nowrap",
    };
  }

  if (width === "auto") {
    return {
      width: "auto",
    };
  }

  return {
    width,
    minWidth: width,
  };
}

function applyColumnAlignmentToNode(
  node: ReactNode,
  columnKinds: MarkdownTableColumnKind[],
  columnWidths: MarkdownTableColumnWidth[]
): ReactNode {
  if (!isValidElement<{ children?: ReactNode }>(node)) {
    return node;
  }

  const elementType = getNodeTableElementType(node);

  if (!elementType) {
    return cloneElement(node, {
      children: applyColumnAlignmentToTree(node.props.children, columnKinds, columnWidths),
    });
  }

  if (elementType === "tr") {
    const cells = Children.toArray(node.props.children).map((child, columnIndex) => {
      const childElementType = getNodeTableElementType(child);

      if (
        !isValidElement<{
          children?: ReactNode;
          className?: string;
          align?: string;
          style?: Record<string, string>;
        }>(child) ||
        (childElementType !== "th" && childElementType !== "td")
      ) {
        return child;
      }

      const explicitAlignment =
        child.props.align === "left" ||
        child.props.align === "center" ||
        child.props.align === "right"
          ? child.props.align
          : undefined;

      const className = [
        getColumnAlignmentClassName(columnKinds[columnIndex] ?? "text", explicitAlignment),
        child.props.className,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const style = {
        ...(child.props.style ?? {}),
        ...(getColumnWidthStyle(columnWidths[columnIndex]) ?? {}),
      };

      return cloneElement(child, {
        className,
        style: Object.keys(style).length > 0 ? style : undefined,
        children:
          childElementType === "th"
            ? stripWidthTokensFromNode(
                applyColumnAlignmentToTree(child.props.children, columnKinds, columnWidths)
              )
            : applyColumnAlignmentToTree(child.props.children, columnKinds, columnWidths),
      });
    });

    return cloneElement(node, { children: cells });
  }

  return cloneElement(node, {
    children: applyColumnAlignmentToTree(node.props.children, columnKinds, columnWidths),
  });
}

function applyColumnAlignmentToTree(
  node: ReactNode,
  columnKinds: MarkdownTableColumnKind[],
  columnWidths: MarkdownTableColumnWidth[]
): ReactNode {
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const alignedChild = applyColumnAlignmentToNode(child, columnKinds, columnWidths);
      if (isValidElement(alignedChild) && alignedChild.key == null) {
        return cloneElement(alignedChild, { key: index });
      }
      return alignedChild;
    });
  }

  return applyColumnAlignmentToNode(node, columnKinds, columnWidths);
}

export function applyMarkdownTableColumnAlignment(children: ReactNode): ReactNode {
  const columnKinds = inferMarkdownTableColumnKindsFromRows(collectTableRows(children));
  const columnWidths = collectColumnWidths(children);

  if (columnKinds.length === 0) {
    return children;
  }

  return applyColumnAlignmentToTree(children, columnKinds, columnWidths);
}
