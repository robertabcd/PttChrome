import { i18n } from './i18n';

export class AboutPane extends React.Component {
  render() {
    const link = (text, url) =>
      '<a href="' + url + '" target="_blank" rel="noreferrer">' + text + '</a>';
    const replacements = {
      '#link_github_iamchucky#': link('Chuck Yang', 'https://github.com/iamchucky'),
      '#link_github_robertabcd#': link('robertabcd', 'https://github.com/robertabcd'),
      '#link_robertabcd_PttChrome#': link('robertabcd/PttChrome', 'https://github.com/robertabcd/PttChrome'),
      '#link_iamchucky_PttChrome#': link('iamchucky/PttChrome', 'https://github.com/iamchucky/PttChrome'),
      '#link_GPL20#': link('General Public License v2.0', 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html')
    };
    const replaced_i18n = (id) => {
      let text = i18n(id);
      for (let key in replacements) {
        text = text.replace(key, replacements[key]);
      }
      return <span dangerouslySetInnerHTML={{__html: text}} />;
    };
    let aboutNewList = i18n('about_new_content').map((text, index) => (
      <li key={"i" + index}>{text}</li>
    ));
    return (
      <div>
        <div className="list-group">
          <h4 className="list-group-item-heading">
            PttChrome<small> - {i18n('about_appName_subtitle')}</small>
          </h4>
          <div id="about_description">
            <p>{replaced_i18n('about_description')}</p>
          </div>
        </div>
        <div className="list-group">
          <h4 className="list-group-item-heading">
            {i18n('about_version_title')}
          </h4>
          <div className="list-group-item-text">
            <ul>
              <li>{replaced_i18n('about_version_current')}</li>
              <li>{replaced_i18n('about_version_original')}</li>
            </ul>
          </div>
        </div>
        <div className="list-group">
          <h4 className="list-group-item-heading">
            {i18n('about_new_title')}
          </h4>
          <div className="list-group-item-text">
            <ul>{aboutNewList}</ul>
          </div>
        </div>
      </div>
    );
  }
}
