import { stringify } from "querystring";
import { decode } from "base58";

const noop = () => {};

export const of = src => Promise.resolve({ src });

export const resolveSrcToImageUrl = ({ src }) =>
  imageUrlResolvers.find(r => r.test(src)).request(src);

export const resolveWithImageDOM = ({ src }) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        src,
        height: img.height,
      });
    img.onerror = reject;
    img.src = src;
  });

export class ImagePreviewer extends React.PureComponent {
  state = {
    pending: undefined,
    value: undefined,
    error: undefined,
  };

  componentDidMount() {
    this.handleStart();
  }

  componentDidUpdate(prevProps) {
    if (this.props.request !== prevProps.request) {
      this.handleStart();
    }
  }

  handleStart(props) {
    this.setState((state, { request }) => {
      request.then(this.handleResolve, this.handleReject);
      return {
        pending: request,
        value: undefined,
        error: undefined,
      };
    });
  }

  handleResolve = value => {
    this.setState(({ pending }, { request }) => {
      if (pending !== request) {
        return;
      }
      return { value };
    });
  };

  handleReject = error => {
    this.setState(({ pending }, { request }) => {
      if (pending !== request) {
        return;
      }
      return { error };
    });
  };

  render() {
    return React.createElement(this.props.component, {
      ...this.props,
      component: undefined,
      request: undefined,
      value: this.state.value,
      error: this.state.error,
    });
  }
}

const getTop = (top, height) => {
  const pageHeight = $(window).height();

  // opening image would pass the bottom of the page
  if (top + height / 2 > pageHeight - 20) {
    if (height / 2 < top) {
      return pageHeight - 20 - height;
    }
  } else if (top - 20 > height / 2) {
    return top - height / 2;
  }
  return 20;
};

ImagePreviewer.OnHover = ({ left, top, value, error }) => {
  if (error) {
    return false;
  } else if (value) {
    return (
      <img
        src={value.src}
        style={{
          display: "block",
          position: "absolute",
          left: left + 20,
          top: getTop(top, value.height),
          maxHeight: "80%",
          maxWidth: "90%",
          zIndex: 2,
        }}
      />
    );
  } else {
    return (
      <i
        className="glyphicon glyphicon-refresh glyphicon-refresh-animate"
        style={{
          position: "absolute",
          left: left + 20,
          top: top,
          zIndex: 2,
        }}
      />
    );
  }
};

ImagePreviewer.Inline = ({ value, error }) => {
  if (error) {
    return false;
  } else if (value) {
    return <img className="easyReadingImg hyperLinkPreview" src={value.src} />;
  } else {
    return (
      <i className="glyphicon glyphicon-refresh glyphicon-refresh-animate" />
    );
  }
};

const imageUrlResolvers = [
  {
    /*
     * Default
     */
    test() {
      return true;
    },
    request() {
      return Promise.reject(new Error("Unimplemented"));
    },
  },
];

const registerImageUrlResolver = imageUrlResolvers.unshift.bind(
  imageUrlResolvers
);

registerImageUrlResolver({
  /*
   * Flic.kr
   */
  regex: /flic\.kr\/p\/(\w+)|flickr\.com\/photos\/[\w@]+\/(\d+)/,
  test(src) {
    return this.regex.test(src);
  },
  request(src) {
    const [, flickrBase58Id, flickrPhotoId] = src.match(this.regex);
    const photoId = flickrBase58Id ? decode(flickrBase58Id) : flickrPhotoId;

    const apiURL = `https://api.flickr.com/services/rest/?${stringify({
      method: "flickr.photos.getInfo",
      api_key: "c8c95356e465b8d7398ff2847152740e",
      photo_id: photoId,
      format: "json",
      nojsoncallback: 1,
    })}`;
    return fetch(apiURL, {
      mode: "cors",
    })
      .then(r => r.json())
      .then(data => {
        if (!data.photo) {
          throw new Error("Not found");
        }
        const { farm, server: svr, id, secret } = data.photo;
        return {
          src: `https://farm${farm}.staticflickr.com/${svr}/${id}_${secret}.jpg`,
        };
      });
  },
});

registerImageUrlResolver({
  /*
   * imgur.com
   */
  regex: /^(https?:\/\/(i\.)?imgur\.com)\/([a-zA-Z0-9]+)(\.[a-zA-Z]+)?$/,
  test(src) {
    return this.regex.test(src);
  },
  request(src) {
    return Promise.resolve({
      src: src.replace(
        this.regex,
        (a, b, c, id) => `https://i.imgur.com/${id}.jpg`
      ),
    });
  },
});

export default ImagePreviewer;
