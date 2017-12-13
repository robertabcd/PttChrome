export const HyperLink = ({ col, row, href, inner }) => (
  <a
    scol={col} // FIXME: data-?
    srow={row} // FIXME: data-?
    className="y"
    href={href}
    rel="noreferrer"
    target="_blank"
  >
    {inner}
  </a>
);

export default HyperLink;
