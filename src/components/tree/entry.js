import Node from "./node";
import Leaf from "./leaf";
import ArrayNode from "./array-node";

function Entry({
  name,
  value,
  level,
  expended,
  path = "",
  onChange,
  editable,
  arrayEntry,
}) {
  if (Array.isArray(value)) {
    return (
      <ArrayNode
        array={value}
        name={name}
        level={level + 1}
        expended={expended}
        path={path}
        onChange={onChange}
        editable={editable}
        arrayEntry={arrayEntry}
      />
    );
  }
  if (typeof value === "object") {
    return (
      <Node
        entity={value}
        name={name}
        level={level + 1}
        expended={expended}
        path={path}
        onChange={onChange}
        editable={editable}
        arrayEntry={arrayEntry}
      />
    );
  }

  return (
    <Leaf
      level={level}
      name={name}
      path={path}
      value={value}
      onChange={onChange}
      editable={editable}
      arrayEntry={arrayEntry}
    />
  );
}

export default Entry;
