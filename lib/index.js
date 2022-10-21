const RuntimeGlobals = require("webpack").RuntimeGlobals;
const ConstDependency = require("webpack/lib/dependencies/ConstDependency");

class MiniProgramGlobalWebpackPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "MiniProgramGlobalWebpackPlugin",
      (compilation, { normalModuleFactory }) => {
        normalModuleFactory.hooks.parser
          .for("javascript/auto")
          .tap("MiniProgramGlobalWebpackPlugin", (parser) => {
            parser.hooks.call.for("Function").tap("MiniProgramGlobalWebpackPlugin", (expression) => {
              if (
                expression.arguments[0] &&
                expression.arguments[0].value === "return this"
              ) {
                const dep = new ConstDependency(
                  `(function(){return ${RuntimeGlobals.global};})`,
                  expression.range,
                );
                dep.loc = expression.loc;
                parser.state.module.addPresentationalDependency(dep);
                return true;
              }
            });
          });
      },
    );
  }
}

module.exports = MiniProgramGlobalWebpackPlugin;
