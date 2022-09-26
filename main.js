import "./style.css"
import init, { parse } from "./atc_router"

const exp1 = `a ^= "text"`
const exp2 = `a == 1 && (b == 2 || c == "foo")`
const exp3 = `lower(http.path) == "/exact" && http.method == "POST" &&
(tls.sni == "foo.com" || tls.sni == "bar.com") && net.source in 1.0.0.0/8 &&
http.headers.user_agent ~ "android" && net.dport == 8001`
const exp4 = `(http.methods == "POST" || http.methods == "PUT" || http.methods == "PATCH") &&
(http.hosts == "headers-1.org" || http.hosts == "headers-2.org") &&
(http.paths ^= "/uri") && (http.headers.location == "my-location-1" ||
http.headers.location == "my-location-2")`

const parse_node = (node) => {
  if (!node) {
    return
  }

  if (node?.type == "Predicate" || node?.expression?.type == "Predicate") {
    return {
      text: { name: node.expression.op.type },
      children: [
        {
          text: {
            name: node.expression.lhs?.transformation
              ? `(${node.expression.lhs?.transformation?.type.toLowerCase()}) ${node.expression.lhs?.var_name}`
              : node.expression.lhs?.var_name,
          },
        },
        {
          text: {
            name: `(${node.expression.rhs?.type.toLowerCase()}) ${node.expression.rhs?.value}`,
          },
        },
      ],
    }
  }

  // type: Logical
  if (node?.type == "Logical") {
    return parse_node(node.expression)
  }

  // type: And / Or
  const ret = {
    text: { name: node?.type },
  }
  const left = parse_node(node?.expressions[0])
  const right = parse_node(node?.expressions[1])
  ret.children = [left, right]

  return ret
}

const parse_ast_json = (str) => {
  const ast = JSON.parse(str)
  console.log(ast)

  const nodes = parse_node(ast)
  console.log(nodes)

  return nodes
}

const tree_structure = {
  chart: {
    container: "#OrganiseChart6",
    levelSeparation: 70,
    siblingSeparation: 30,
    subTeeSeparation: 30,
    nodeAlign: "BOTTOM",
    scrollbar: "fancy",
    padding: 0,
    node: { HTMLclass: "tree-node" },
    connectors: {
      type: "straight",
      style: {
        "stroke-width": 2,
        "stroke-linecap": "round",
        stroke: "#ccc",
      },
      stackIndent: 10,
    },
  },

  nodeStructure: {
    text: { name: "LIFE" },
    HTMLclass: "the-parent",
    children: [
      {
        text: { name: "true bacteria" },
      },
      {
        text: { name: "true bacteria" },
      },
    ],
  },
}

init().then((wasm) => {
  //console.log(parse(exp4)) // test if it is ok

  //parse_ast_json(parse(exp4))

  const dslEle = document.querySelector("#dsl")
  const dsl = dslEle.innerText.trim()
  const nodes = parse_ast_json(parse(dsl))

  const astDom = document.querySelector("#OrganiseChart6")

  dslEle.addEventListener("input", (e => {
    const dsl = dslEle.innerText.trim()
    console.log(dsl)

    try {
      const nodes = parse_ast_json(parse(dsl))

      tree_structure.nodeStructure = nodes
      new Treant(tree_structure)
    } catch (e) {
      astDom.innerHTML = `<div id="err"><pre style="font-size: 18px; width: 500px; margin-left: auto; margin-right: auto; color: crimson">Syntax error: <br/>${e}</pre></div>`
    }
  }))

  tree_structure.nodeStructure = nodes
  new Treant(tree_structure)
})

window.addEventListener("click", (e) => {
  if (e.target.id === "dsl" || e.target.id === "dsl-expression") {
    return
  }

  Prism.highlightAll()
})

const exampleCallback = (expression) => {
  return function () {
    document.querySelector("#dsl-expression").innerHTML = expression
    document.querySelector("#dsl").dispatchEvent(new Event('input'))
    Prism.highlightAll()
  }
}
document.querySelector("#exp1").addEventListener("click", exampleCallback(exp1))
document.querySelector("#exp2").addEventListener("click", exampleCallback(exp2))
document.querySelector("#exp3").addEventListener("click", exampleCallback(exp3))
document.querySelector("#exp4").addEventListener("click", exampleCallback(exp4))
