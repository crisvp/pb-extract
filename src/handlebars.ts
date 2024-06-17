import handlebars from 'handlebars';

/**
 * Handlebars helper to convert a string to PascalCase. Pass any number of arguments.
 *
 * @param {...any[]} args E.g., use: {{pascalCase "hello" "world"}}
 * @returns {string}
 */
function pascalCase(...args: any[]): string {
  return args
    .filter(a => typeof a === 'string')
    .map(s => s[0].toUpperCase() + s.slice(1))
    .join('');
}

handlebars.registerHelper({ pascalCase });
export default handlebars;
