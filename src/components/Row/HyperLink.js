export const HyperLink = ({
  col,
  row,
  href,
  inner,
  onMouseOver,
  onMouseOut,
}) => (
  <a
    onMouseOver={onMouseOver}
    onMouseOut={onMouseOut}
    className="y"
    href={href}
    rel="noreferrer"
    target="_blank"
  >
    {inner}
  </a>
);

export default HyperLink;
