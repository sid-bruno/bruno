const stringify = require('../src/jsonToBru');
const bruToJson = require('../src/bruToJson');

describe('jsonToBru stringify', () => {
  describe('body:ws', () => {
    it('stringifies a valid bruno request | smoke', () => {
      const input = {
        ws: {
          url: 'ws://localhost:3000',
          body: 'ws'
        },
        body: {
          mode: 'ws',
          ws: [
            {
              content: '{"foo":"bar"}',
              name: 'message 1',
              type: 'json'
            }
          ]
        },
        settings: {
          keepAliveInterval: 30,
          timeout: 250
        }
      };

      const output = stringify(input);

      // generic structure snapshot
      expect(output).toMatchInlineSnapshot(`
        "ws {
          url: ws://localhost:3000
          body: ws
        }

        body:ws {
          name: message 1
          type: json
          content: '''
            {"foo":"bar"}
          '''
        }

        settings {
          keepAliveInterval: 30
          timeout: 250
        }
        "
      `);

      // Hard check if the input settings were stored as is
      expect(output).toMatch(new RegExp(`keepAliveInterval: ${input.settings.keepAliveInterval}`));
      expect(output).toMatch(new RegExp(`timeout: ${input.settings.timeout}`));
    });
  });

  describe('multi-line values', () => {
    it('handles multi-line values in URL, headers, params, and vars', () => {
      const input = {
        meta: {
          name: 'new-line',
          type: 'http',
          seq: 1
        },
        http: {
          method: 'get',
          url: 'https://httpbin.io/anything?foo=hello\nworld',
          body: 'none',
          auth: 'oauth2'
        },
        params: [
          {
            name: 'foo',
            value: 'hello\nworld',
            enabled: true,
            type: 'query'
          }
        ],
        headers: [
          {
            name: 'test header',
            value: 't1\nt2',
            enabled: true
          }
        ],
        vars: {
          req: [
            {
              name: 'test-var',
              value: 't1\nt2',
              enabled: true
            }
          ]
        }
      };

      const output = stringify(input);

      expect(output).toMatchInlineSnapshot(`
        "meta {
          name: new-line
          type: http
          seq: 1
        }

        get {
          url: '''
            https://httpbin.io/anything?foo=hello
            world
        '''
          body: none
          auth: oauth2
        }

        params:query {
          foo: '''
            hello
            world
          '''
        }

        headers {
          "test header": '''
            t1
            t2
          '''
        }

        vars:pre-request {
          test-var: '''
            t1
            t2
          '''
        }
        "
      `);
    });
  });
});

describe('jsonToBru version field in meta output', () => {
  it('writes version as the first field in the meta block', () => {
    const json = {
      meta: { version: 1, name: 'Get Users', type: 'http', seq: 1 },
      http: { method: 'get', url: 'https://api.example.com/users' }
    };
    const output = stringify(json);
    const metaBlock = output.match(/meta \{([^}]+)\}/s)?.[1] ?? '';
    const lines = metaBlock.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines[0]).toBe('version: 1');
  });

  it('does not write a version field when meta.version is undefined', () => {
    const json = {
      meta: { name: 'Get Users', type: 'http', seq: 1 },
      http: { method: 'get', url: 'https://api.example.com/users' }
    };
    const output = stringify(json);
    expect(output).not.toContain('version:');
  });

  it('round-trips: parse then stringify preserves version', () => {
    const input = `meta {
  version: 1
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
}
`;
    const json = bruToJson(input);
    const output = stringify(json);
    const reparsed = bruToJson(output);
    expect(reparsed.meta.version).toBe(json.meta.version);
  });
});
