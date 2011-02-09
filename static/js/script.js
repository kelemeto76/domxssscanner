jQuery(function($) {
  DOMXSS.scanResponse($);
  if ("undefined" != typeof script_urls) {
    var urls = $.parseJSON(script_urls)
    for (url in urls) {
      var request_url = document.location.href.replace(document.location.search, '') + "?url=" + encodeURIComponent(urls[url]);
      $.get(request_url, function(data) {
        $('#main').append(data);
        DOMXSS.scanResponse($);
      });
    }
  }
});

var DOMXSS = {
  // regular expressions from https://code.google.com/p/domxsswiki/wiki/FindingDOMXSS
  re_sources: new RegExp(/(location\s*[\[.])|([.\[]\s*["']?\s*(arguments|dialogArguments|innerHTML|write(ln)?|open(Dialog)?|showModalDialog|cookie|URL|documentURI|baseURI|referrer|name|opener|parent|top|content|self|frames)\W)|(localStorage|sessionStorage|Database)/g),
  re_sinks: new RegExp(/((src|href|data|location|code|value|action)\s*["'\]]*\s*\+?\s*=)|((replace|assign|navigate|getResponseHeader|open(Dialog)?|showModalDialog|eval|evaluate|execCommand|execScript|setTimeout|setInterval)\s*["']]*\s*\()/g),

  source_count: 0,
  sink_count: 0,

  highlight: function(text) {
    text = text.replace(DOMXSS.re_sinks, function(m){
      DOMXSS.sink_count++;
      return 'DOMXSS_SINK_START' + m + 'DOMXSS_END';
    });
    text = text.replace(DOMXSS.re_sources, function(m){
      DOMXSS.source_count++;
      return 'DOMXSS_SOURCE_START' + m + 'DOMXSS_END';
    });
    return text;
  },
  markUp: function(text) {
    text = text.replace(/DOMXSS_SINK_START/g, '<span class="domxss_sink">');
    text = text.replace(/DOMXSS_SOURCE_START/g, '<span class="domxss_source">');
    text = text.replace(/DOMXSS_END/g, '</span>');
    return text;
  },
  scanResponse: function($) {
    DOMXSS.source_count = 0;
    DOMXSS.sink_count = 0;
    $('.response_text').each(function(idx, elt) {
      //http://debuggable.com/posts/encode-html-entities-with-jquery:480f4dd6-13cc-4ce9-8071-4710cbdd56cb
      //var text = $(elt).text(DOMXSS.highlight(elt.innerHTML)).html();
      var text = DOMXSS.markUp(DOMXSS.highlight(elt.innerHTML));
      var p = $(elt).parent();
      $(elt).remove();
      p.append('<h3 class="domxss_source">Number of sources found: ' + DOMXSS.source_count + '</h3>');
      p.append('<h3 class="domxss_sink">Number of sinks found: ' + DOMXSS.sink_count + '</h3>');
      p.append('<pre class="domxss_highlighted">' + text + '</pre>');
    });
  }
};