(global as any).DotNet = { attachReviver: jest.fn() };

import CircuitRegistry from '../src/Platform/Circuits/CircuitRegistry';
import { NullLogger } from '../src/Platform/Logging/Loggers';
import { JSDOM } from 'jsdom';

describe('CircuitRegistry', () => {

  it('discoverPrerenderedCircuits returns discovered prerendered circuits', () => {
    const dom = new JSDOM(`<!doctype HTML>
    <html>
      <head>
        <title>Page</title>
      </head>
      <body>
        <header>Preamble</header>
        <!-- M.A.C.Component: {"circuitId":"1234","rendererId":"2","componentId":"1"} -->
        <p>Prerendered content</p>
        <!-- M.A.C.Component: 1 -->
        <footer></footer>
      </body>
    </html>`);

    const results = CircuitRegistry.discoverPrerenderedCircuits(dom.window.document, NullLogger.instance);

    expect(results.length).toEqual(1);
    const result = results[0];
    expect(result.circuitId).toEqual("1234");
    expect(result.rendererId).toEqual(2);
    expect(result.componentId).toEqual(1);

  });

  it('discoverPrerenderedCircuits returns discovers multiple prerendered circuits', () => {
    const dom = new JSDOM(`<!doctype HTML>
    <html>
      <head>
        <title>Page</title>
      </head>
      <body>
        <header>Preamble</header>
        <!-- M.A.C.Component: {"circuitId":"1234","rendererId":"2","componentId":"1"} -->
        <p>Prerendered content</p>
        <!-- M.A.C.Component: 1 -->
        <footer>
          <!-- M.A.C.Component: {"circuitId":"1234","rendererId":"2","componentId":"2"} -->
          <p>Prerendered content</p>
          <!-- M.A.C.Component: 2 -->
        </footer>
      </body>
    </html>`);

    const results = CircuitRegistry.discoverPrerenderedCircuits(dom.window.document, NullLogger.instance);

    expect(results.length).toEqual(2);

    const first = results[0];
    expect(first.circuitId).toEqual("1234");
    expect(first.rendererId).toEqual(2);
    expect(first.componentId).toEqual(1);

    const second = results[1];
    expect(second.circuitId).toEqual("1234");
    expect(second.rendererId).toEqual(2);
    expect(second.componentId).toEqual(2);
  });

  it('discoverPrerenderedCircuits skips malformed circuits', () => {
    const dom = new JSDOM(`<!doctype HTML>
    <html>
      <head>
        <title>Page</title>
      </head>
      <body>
        <header>Preamble</header>
        <!-- M.A.C.Component: {"circuitId":"1234","rendererId":"2","componentId":"1"} -->
        <p>Prerendered content</p>
        <!-- M.A.C.Component: 2 -->
        <footer>
        <!-- M.A.C.Component: {"circuitId":"1234","rendererId":"2","componentId":"2"} -->
        <p>Prerendered content</p>
        <!-- M.A.C.Component: 1 -->
        </footer>
      </body>
    </html>`);

    const results = CircuitRegistry.discoverPrerenderedCircuits(dom.window.document, NullLogger.instance);

    expect(results.length).toEqual(0);

  });

  it('discoverPrerenderedCircuits initializes circuits', () => {
    const dom = new JSDOM(`<!doctype HTML>
    <html>
      <head>
        <title>Page</title>
      </head>
      <body>
        <header>Preamble</header>
        <!-- M.A.C.Component: {"circuitId":"1234","rendererId":"2","componentId":"1"} -->
        <p>Prerendered content</p>
        <!-- M.A.C.Component: 1 -->
        <footer>
          <!-- M.A.C.Component: {"circuitId":"1234","rendererId":"2","componentId":"2"} -->
          <p>Prerendered content</p>
          <!-- M.A.C.Component: 2 -->
        </footer>
      </body>
    </html>`);

    const results = CircuitRegistry.discoverPrerenderedCircuits(dom.window.document, NullLogger.instance);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      result.initialize();
    }

  });

});
