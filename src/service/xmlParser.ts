'use strict';

type XmlNode = {
  tag: string;
  children: XmlNode[];
  text: string;
};

// Matches an opening tag (with optional attributes and optional self-closing slash) or a closing tag.
const TAG_REGEX = /<([a-zA-Z_][\w:.-]*)((?:\s+[^<>]*?)?)(\/?)>|<\/([a-zA-Z_][\w:.-]*)\s*>/g;

/**
 * Minimal XML parser for Salesforce metadata files: parses a document into a plain object,
 * collapsing repeated sibling tags into arrays and leaf elements into their text content.
 * Attributes are not preserved since none of the metadata this plugin reads relies on them.
 */
export function parseXml(xml: string): Record<string, unknown> {
  const cleaned = xml
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_match, content: string) => content);

  const root = parseRoot(cleaned);
  return root ? { [root.tag]: simplify(root) } : {};
}

function parseRoot(xml: string): XmlNode | null {
  TAG_REGEX.lastIndex = 0;
  const stack: XmlNode[] = [];
  let root: XmlNode | null = null;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TAG_REGEX.exec(xml)) !== null) {
    const [, openTag, , selfClosing, closeTag] = match;
    const current = stack.at(-1);

    if (current && match.index > lastIndex) {
      current.text += xml.slice(lastIndex, match.index);
    }
    lastIndex = TAG_REGEX.lastIndex;

    if (closeTag) {
      stack.pop();
      continue;
    }

    const node: XmlNode = { tag: openTag, children: [], text: '' };
    if (current) {
      current.children.push(node);
    } else {
      root = node;
    }
    if (!selfClosing) {
      stack.push(node);
    }
  }

  return root;
}

function simplify(node: XmlNode): unknown {
  if (node.children.length === 0) {
    return node.text.trim();
  }

  const result: Record<string, unknown> = {};
  for (const child of node.children) {
    const value = simplify(child);
    const existing = result[child.tag];
    if (existing === undefined) {
      result[child.tag] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[child.tag] = [existing, value];
    }
  }
  return result;
}
