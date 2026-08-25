'use strict';

import { describe, expect, it } from 'vitest';

import { parseXml } from '../../src/service/xmlParser.js';

describe('parseXml', () => {
  it('collapses repeated sibling tags into an array', () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<ApexTestSuite xmlns="http://soap.sforce.com/2006/04/metadata">',
      '    <testClassName>FirstTest</testClassName>',
      '    <testClassName>SecondTest</testClassName>',
      '</ApexTestSuite>',
    ].join('\n');

    const parsed = parseXml(xml) as { ApexTestSuite?: { testClassName?: string[] } };
    expect(parsed.ApexTestSuite?.testClassName).toEqual(['FirstTest', 'SecondTest']);
  });

  it('returns a single string for a lone matching tag', () => {
    const xml = '<ApexTestSuite><testClassName>OnlyTest</testClassName></ApexTestSuite>';
    const parsed = parseXml(xml) as { ApexTestSuite?: { testClassName?: string } };
    expect(parsed.ApexTestSuite?.testClassName).toEqual('OnlyTest');
  });

  it('strips comments and unwraps CDATA sections', () => {
    const xml = [
      '<ApexTestSuite>',
      '    <!-- a comment -->',
      '    <testClassName><![CDATA[CdataTest]]></testClassName>',
      '</ApexTestSuite>',
    ].join('\n');

    const parsed = parseXml(xml) as { ApexTestSuite?: { testClassName?: string } };
    expect(parsed.ApexTestSuite?.testClassName).toEqual('CdataTest');
  });

  it('returns an empty string for a self-closing tag', () => {
    const xml = '<ApexTestSuite><testClassName/></ApexTestSuite>';
    const parsed = parseXml(xml) as { ApexTestSuite?: { testClassName?: string } };
    expect(parsed.ApexTestSuite?.testClassName).toEqual('');
  });

  it('returns an empty object when there is no root element', () => {
    expect(parseXml('')).toEqual({});
  });
});
