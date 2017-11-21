'use struct';

export class ImageURL {
  static register(clazz) {
    if (!this._providers) {
      this._providers = [];
    }
    this._providers.push(clazz);
  }

  static create(href) {
    for (let provider of this._providers) {
      let instance = provider.create(href);
      if (instance) {
        return instance;
      }
    }
    return null;
  }
}

class FlickrImageURL {
  // To decode base58 of flickr photo id
  // ref: https://www.flickr.com/groups/51035612836@N01/discuss/72157616713786392/72157620931323757
  static base58_decode(snipcode) {
    var alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    var num = snipcode.length;
    var decoded = 0;
    var multi = 1;
    for (var i = (num-1); i >= 0; i--) {
      decoded = decoded + multi * alphabet.indexOf(snipcode[i]);
      multi = multi * alphabet.length;
    }
    return decoded;
  }

  static create(href) {
    let found_flickr = href.match(
      'flic\.kr\/p\/\(\\w\+\)|flickr\.com\/photos\/[\\w@]\+\/\(\\d\+\)');
    if (!found_flickr) {
      return null;
    }
    let flickrBase58Id = found_flickr[1];
    let flickrPhotoId = flickrBase58Id ?
      this.base58_decode(flickrBase58Id) : found_flickr[2];
    return new FlickrImageURL(flickrPhotoId);
  }

  constructor(photoID) {
    this._photoID = photoID;
  }

  fetchSrc() {
    const apiURL = "https://api.flickr.com/services/rest/" +
      "?method=flickr.photos.getInfo" +
      "&api_key=c8c95356e465b8d7398ff2847152740e" +
      "&photo_id=" + encodeURIComponent(this._photoID) +
      "&format=json" + 
      "&jsoncallback=?";
    return new Promise(function(resolve, reject) {
      $.getJSON(apiURL, function(data) {
        if (data.photo) {
          let p = data.photo;
          let src = "https://farm" + p.farm + ".staticflickr.com/"+
            p.server + "/" + p.id + "_" + p.secret + ".jpg";
          resolve(src);
        } else {
          reject();
        }
      });
    });
  }
}
ImageURL.register(FlickrImageURL);

// ImgurAlbumImageURL resolve an imgur album URL with images inside.
// TODO: What about multiple images?
class ImgurAlbumImageURL {
  static create(href) {
    let re = /^https?:\/\/(?:i\.)?imgur.com\/a\/(\w+)/;
    if (href.match(re)) {
      return new ImgurAlbumImageURL(RegExp.$1);
    }
    return null;
  }

  constructor(albumID) {
    this._albumID = albumID;
  }

  fetchSrc() {
    let imgurApi = 'https://api.imgur.com/3/album/' + this._albumID;
    let apiKey = 'Client-ID 66f9b381f0785a5';
    return new Promise( (resolve, reject) => {
      $.ajax({
        url: imgurApi,
        method: 'GET',
        headers: { 'Authorization': apiKey }
      }).done( (res) => {
        if (res.data.images_count === 1)
          resolve(res.data.images[0].link);
        else
          reject('resolve URL fail');
      });
    });
  }
}
ImageURL.register(ImgurAlbumImageURL);

class ImgurImageURL {
  static create(href) {
    if (href.match('^https?://(i\.)?imgur\.com/')) {
      return new ImgurImageURL(href);
    }
    return null;
  }

  constructor(href) {
    this._href = href;
  }

  fetchSrc() {
    let src = this._href.replace(
      /^https?:\/\/imgur.com/, 'https://i.imgur.com') + '.jpg';
    return Promise.resolve(src);
  }
}
ImageURL.register(ImgurImageURL);

class GenericImageURL {
  static create(href) {
    // TODO: add support for common suffixes.
    return null;
  }

  fetchSrc() {
    return Promise.reject('not implemented');
  }
}
ImageURL.register(GenericImageURL);
