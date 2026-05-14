const parser = require('../src/bruToJson');
const { BruVersionMismatchError, CURRENT_BRU_VERSION } = require('../src/version');

describe('bruToJson parser', () => {
  describe('body:ws', () => {
    it('infers message and settings | smoke', () => {
      const input = `
body:ws {
    type: json
    name: message 1
    content: '''
      {"foo":"bar"}
    ''' 
}

settings {
      timeout: 30
}
`;

      const expected = {
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
          encodeUrl: false,
          timeout: 30
        }
      };

      const output = parser(input);
      expect(output).toEqual(expected);
    });
  });

  describe('body:grpc', () => {
    it('parses message content with name and content', () => {
      const input = `
body:grpc {
    name: message 1
    content: '''
      {"foo":"bar"}
    ''' 
}
`;

      const expected = {
        body: {
          mode: 'grpc',
          grpc: [
            {
              content: '{"foo":"bar"}',
              name: 'message 1'
            }
          ]
        }
      };

      const output = parser(input);
      expect(output).toEqual(expected);
    });

    it('parses message with variables in content', () => {
      const input = `
body:grpc {
    name: message 1
    content: '''
      {"id":{{userId}},"name":"{{userName}}"}
    ''' 
}
`;

      const expected = {
        body: {
          mode: 'grpc',
          grpc: [
            {
              content: '{"id":{{userId}},"name":"{{userName}}"}',
              name: 'message 1'
            }
          ]
        }
      };

      const output = parser(input);
      expect(output).toEqual(expected);
    });
  });

  describe('multi-line values', () => {
    it('parses multi-line values in URL, headers, params, and vars', () => {
      const input = `
meta {
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
`;

      const expected = {
        meta: {
          name: 'new-line',
          type: 'http',
          seq: '1'
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
              enabled: true,
              local: false
            }
          ]
        }
      };

      const output = parser(input);
      expect(output).toEqual(expected);
    });

    it('parses multiline body parts with content type annotation', () => {
      const input = `
body:multipart-form {
  filePart: '''
    Line1
    Line2
  ''' @contentType(text/plain)
}
`;

      const expected = {
        body: {
          multipartForm: [
            {
              name: 'filePart',
              value: 'Line1\nLine2',
              enabled: true,
              type: 'text',
              contentType: 'text/plain'
            }
          ]
        }
      };

      const output = parser(input);
      expect(output).toEqual(expected);
    });
  });
});

describe('bruToJson version field', () => {
  it('parses a file with no version field without error', () => {
    const input = `
meta {
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
}
`;
    expect(() => parser(input)).not.toThrow();
  });

  it('includes version in the parsed meta when present', () => {
    const input = `
meta {
  version: 1
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
}
`;
    const output = parser(input);
    expect(output.meta.version).toBe('1');
  });

  it('throws BruVersionMismatchError when version exceeds CURRENT_BRU_VERSION', () => {
    const input = `
meta {
  version: 999
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
}
`;
    expect(() => parser(input)).toThrow(BruVersionMismatchError);
  });

  it('BruVersionMismatchError carries the correct code and version numbers', () => {
    const input = `
meta {
  version: 999
  name: Get Users
  type: http
  seq: 1
}

get {
  url: https://api.example.com/users
}
`;
    try {
      parser(input);
    } catch (err) {
      expect(err.code).toBe('BRU_VERSION_MISMATCH');
      expect(err.fileVersion).toBe(999);
      expect(err.maxVersion).toBe(CURRENT_BRU_VERSION);
    }
  });
});
