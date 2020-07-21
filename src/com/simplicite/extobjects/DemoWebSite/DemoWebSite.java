package com.simplicite.extobjects.DemoWebSite;

import org.json.JSONObject;

import com.simplicite.util.AppLog;
import com.simplicite.util.ExternalObject;
import com.simplicite.util.tools.HTMLTool;
import com.simplicite.util.tools.Parameters;
import com.simplicite.webapp.web.BootstrapWebPage;

/**
 * Web site custom frontend UI
 */
public class DemoWebSite extends ExternalObject {
	private static final long serialVersionUID = 1L;

	/**
	 * Display method
	 * @param params Request parameters
	 */
	@Override
	public Object display(Parameters params) {
		try {
			// ZZZ IMPORTANT ZZZ Standalone page
			setDecoration(false);

			// Bootstrap page
			BootstrapWebPage wp = new BootstrapWebPage(params.getRoot(), getDisplay());

			wp.setFavicon(HTMLTool.getResourceIconURL(this, "FAVICON"));
			wp.appendAjax();
			wp.appendJSInclude(HTMLTool.getResourceJSURL(this, "SCRIPT"));
			wp.appendCSSInclude(HTMLTool.getResourceCSSURL(this, "STYLES"));
			wp.appendHTML(HTMLTool.getResourceHTMLContent(this, "HTML"));

			JSONObject p = params.toJSONObject();
			p.put("loadingImage", HTMLTool.getResourceImageURL(this, "LOADING"));
			p.put("logoImage", HTMLTool.getResourceImageURL(this, "LOGO"));

			wp.setReady("DemoWebSiteBootstrap.render(" + p.toString() + ");");

			return wp.toString();
		} catch (Exception e) {
			AppLog.error(getClass(), "display", null, e, getGrant());
			return e.getMessage();
		}
	}
}
