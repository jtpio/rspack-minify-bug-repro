// Base class that expects content to be defined
class MainAreaWidget {
  constructor(options) {
    const content = options.content;
    // This line throws: "Cannot read properties of undefined (reading 'node')"
    content.node.setAttribute('role', 'region');
    this._content = content;
  }

  get content() {
    return this._content;
  }
}

class DocumentWidget extends MainAreaWidget {
  constructor(options) {
    super(options);
    this.context = options.context;
  }
}

function createContent(context) {
  return {
    node: {
      setAttribute: (key, value) => {
        console.log(`setAttribute called: ${key}=${value}`);
      }
    },
    revealed: Promise.resolve(),
    context
  };
}

class CSVDocumentWidget extends DocumentWidget {
  constructor(options) {
    // THIS BREAKS
    let { content, context, delimiter, reveal, ...other } = options;
    content = content || createContent(context);
    reveal = Promise.all([reveal, content.revealed]);
    super({ content, context, reveal, ...other });

    if (delimiter) {
      content.delimiter = delimiter;
    }
  }
}

class CSVDocumentWidgetFixed extends DocumentWidget {
  constructor(options) {
    // THIS WORKS:
    const content = options.content ?? createContent(options.context);
    const reveal = Promise.all([options.reveal, content.revealed]);
    super({
      content,
      context: options.context,
      reveal,
      translator: options.translator
    });

    if (options.delimiter) {
      content.delimiter = options.delimiter;
    }
  }
}

// Test
console.log('Testing CSVDocumentWidget...');
try {
  const widget = new CSVDocumentWidget({
    context: { path: 'test.csv' },
    translator: {}
  });
  console.log('✓ CSVDocumentWidget created successfully');
} catch (e) {
  console.log('✗ CSVDocumentWidget FAILED:', e.message);
}

console.log('\nTesting CSVDocumentWidgetFixed...');
try {
  const widget = new CSVDocumentWidgetFixed({
    context: { path: 'test.csv' },
    translator: {}
  });
  console.log('✓ CSVDocumentWidgetFixed created successfully');
} catch (e) {
  console.log('✗ CSVDocumentWidgetFixed FAILED:', e.message);
}
