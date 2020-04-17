package com.simplicite.extobjects.DemoWebSite;

import java.util.LinkedHashMap;

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
			boolean dark = params.getBooleanParameter("dark");
			BootstrapWebPage wp = new BootstrapWebPage(params.getRoot(), getDisplay(), dark ? "dark" : null);
			if (dark)
				wp.appendCSS(".navbar-inverse { background-color: #464545; } .navbar-inverse .navbar-nav>li>a:hover, .navbar-inverse .navbar-nav>li>a:focus { color: #A0A0A0; }");

			wp.appendJS("var ROOT = \"" + wp.getRoot() + "\";");
			wp.appendAjax();
			wp.appendFullcalendar();
			wp.appendJSInclude(HTMLTool.getResourceJSURL(this, "SCRIPT"));
			wp.setFavicon(HTMLTool.getResourceIconURL(this, "FAVICON"));
			wp.setReady("DemoWebSiteBootstrap.init(\"" + HTMLTool.getResourceImageURL(this, "LOADING") + "\");");

			LinkedHashMap<String, String> m = new LinkedHashMap<>();
			m.put("menu-catalog", "Catalog");
			m.put("menu-orders", "My orders");
			m.put("menu-messages", "My messages");
			m.put("menu-agenda", "My deliveries");
			m.put("menu-news", "News");
			wp.setMenu("menu-brand", "<img src=\"" + HTMLTool.getResourceImageURL(this, "LOGO") + "\"/>", m, true, false, true);

			wp.appendHTML("<div id=\"header\" class=\"well\" style=\"display: none;\"></div>");
			wp.appendHTML("<div id=\"info\" class=\"alert alert-success\" style=\"display: none;\"></div>");
			wp.appendHTML("<div id=\"warning\" class=\"alert alert-warning\" style=\"display: none;\"></div>");
			wp.appendHTML("<div id=\"error\" class=\"alert alert-danger\" style=\"display: none;\"></div>");
			wp.appendHTML("<div id=\"main\"></div>");
			wp.appendHTML("<div id=\"footer\">&copy; Simplicit&eacute; Software</div>");

			return wp.toString();
		} catch (Exception e) {
			AppLog.error(getClass(), "display", null, e, getGrant());
			return e.getMessage();
		}
	}
}
