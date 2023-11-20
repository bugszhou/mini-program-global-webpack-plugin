
const webpack = require("webpack");
const RuntimeGlobals = require("webpack").RuntimeGlobals;
const ConstDependency = require("webpack/lib/dependencies/ConstDependency");

/** @typedef {import("estree").MemberExpression} MemberExpressionNode */
/** @typedef {import("webpack").Compilation} Compilation */
/** @typedef {Compilation["params"]} CompilationParams */
/** @typedef {webpack.PathData} PathData */

class MiniProgramGlobalWebpackPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "MiniProgramGlobalWebpackPlugin",
      /**
       * 
       * @param {webpack.Compilation} compilation 
       * @param {CompilationParams} opts 
       */
      (compilation, opts) => {
        const  { normalModuleFactory } = opts;

        normalModuleFactory.hooks.parser
          .for("javascript/auto")
          .tap("MiniProgramGlobalWebpackPlugin", 
          /**
           * @param {webpack.javascript.JavascriptParser} parser 
           */
          (parser) => {
            parser.hooks.call
              .for("Function")
              .tap("MiniProgramGlobalWebpackPlugin", (expression) => {
                if (
                  expression.arguments[0] &&
                  expression.arguments[0].value === "return this"
                ) {
                  const dep = new ConstDependency(
                    `(function(){if(typeof wx !== "undefined") {return wx.__mini_program_global__;}if(typeof my !== "undefined") {return my.__mini_program_global__;}})`,
                    expression.range,
                  );
                  dep.loc = expression.loc;
                  parser.state.module.addPresentationalDependency(dep);
                  return true;
                }
              });

            parser.hooks.evaluateCallExpressionMember.for("async").tap(
              "MiniProgramGlobalWebpackPlugin",
              /** @param {import("webpack/lib/javascript/JavascriptParser").CallExpression} expression */ (expression, params) => {
                if (params.identifier === "miniProgramRequire") {
                  const dep = new ConstDependency(`require.async(__mini_program_path__ + ${expression.arguments[0].raw});`, expression.range);
                  dep.loc = expression.loc;
                  parser.state.module.addPresentationalDependency(dep);
                }
              },
            );
          });
      },
    );
  }
}

module.exports = MiniProgramGlobalWebpackPlugin;
