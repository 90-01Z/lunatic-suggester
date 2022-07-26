import Indent from "../indent";
import Etiquette from "../etiquette";

function Content({ value }) {
  if (value === undefined) {
    return <span className="undefined">undefined</span>;
  }
  if (typeof value === "string") {
    return (
      <span className="string">
        <span className="quote">"</span>
        <span className="content">{value}</span>
        <span className="quote">"</span>
      </span>
    );
  }
  return <span className="default">{value}</span>;
}

function Value({ value }) {
  return (
    <span className="value">
      <Content value={value} />
    </span>
  );
}

function Leaf({ name, path, value, level, onChange, editable, arrayEntry }) {
  return (
    <>
      <Indent index={level + 1} />
      <span className="leaf">
        <Etiquette
          value={name}
          onChange={onChange}
          path={path}
          name={name}
          editable={editable && !arrayEntry}
        >{`${name} :`}</Etiquette>
        <Etiquette
          value={value}
          onChange={onChange}
          path={path}
          name={name}
          editable={editable}
        >
          <Value
            value={value}
            onChange={onChange}
            path={path}
            name={name}
            editable={editable}
          />
        </Etiquette>
      </span>
    </>
  );
}

export default Leaf;
