var Yr = Object.defineProperty;
var Lt = (e) => {
	throw TypeError(e);
};
var en = (e, t, r) =>
	t in e
		? Yr(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r })
		: (e[t] = r);
var w = (e, t, r) => en(e, typeof t != "symbol" ? t + "" : t, r),
	at = (e, t, r) => t.has(e) || Lt("Cannot " + r);
var c = (e, t, r) => (
		at(e, t, "read from private field"), r ? r.call(e) : t.get(e)
	),
	P = (e, t, r) =>
		t.has(e)
			? Lt("Cannot add the same private member more than once")
			: t instanceof WeakSet
				? t.add(e)
				: t.set(e, r),
	v = (e, t, r, n) => (
		at(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r
	),
	b = (e, t, r) => (at(e, t, "access private method"), r);
var Nt = (e, t, r, n) => ({
	set _(s) {
		v(e, t, s, r);
	},
	get _() {
		return c(e, t, n);
	},
});
var ur = { Stringify: 1 },
	M = (e, t) => {
		const r = new String(e);
		return (r.isEscaped = !0), (r.callbacks = t), r;
	},
	tn = /[&<>'"]/,
	hr = async (e, t) => {
		let r = "";
		t || (t = []);
		const n = await Promise.all(e);
		for (let s = n.length - 1; (r += n[s]), s--, !(s < 0); s--) {
			let i = n[s];
			typeof i == "object" && t.push(...(i.callbacks || []));
			const o = i.isEscaped;
			if (
				((i = await (typeof i == "object" ? i.toString() : i)),
				typeof i == "object" && t.push(...(i.callbacks || [])),
				i.isEscaped ?? o)
			)
				r += i;
			else {
				const a = [r];
				ie(i, a), (r = a[0]);
			}
		}
		return M(r, t);
	},
	ie = (e, t) => {
		const r = e.search(tn);
		if (r === -1) {
			t[0] += e;
			return;
		}
		let n,
			s,
			i = 0;
		for (s = r; s < e.length; s++) {
			switch (e.charCodeAt(s)) {
				case 34:
					n = "&quot;";
					break;
				case 39:
					n = "&#39;";
					break;
				case 38:
					n = "&amp;";
					break;
				case 60:
					n = "&lt;";
					break;
				case 62:
					n = "&gt;";
					break;
				default:
					continue;
			}
			(t[0] += e.substring(i, s) + n), (i = s + 1);
		}
		t[0] += e.substring(i, s);
	},
	dr = (e) => {
		const t = e.callbacks;
		if (!(t != null && t.length)) return e;
		const r = [e],
			n = {};
		return (
			t.forEach((s) => s({ phase: ur.Stringify, buffer: r, context: n })), r[0]
		);
	},
	pr = async (e, t, r, n, s) => {
		typeof e == "object" &&
			!(e instanceof String) &&
			(e instanceof Promise || (e = e.toString()),
			e instanceof Promise && (e = await e));
		const i = e.callbacks;
		return i != null && i.length
			? (s ? (s[0] += e) : (s = [e]),
				Promise.all(i.map((a) => a({ phase: t, buffer: s, context: n }))).then(
					(a) =>
						Promise.all(a.filter(Boolean).map((l) => pr(l, t, !1, n, s))).then(
							() => s[0],
						),
				))
			: Promise.resolve(e);
	},
	rn = (e, ...t) => {
		const r = [""];
		for (let n = 0, s = e.length - 1; n < s; n++) {
			r[0] += e[n];
			const i = Array.isArray(t[n]) ? t[n].flat(1 / 0) : [t[n]];
			for (let o = 0, a = i.length; o < a; o++) {
				const l = i[o];
				if (typeof l == "string") ie(l, r);
				else if (typeof l == "number") r[0] += l;
				else {
					if (typeof l == "boolean" || l === null || l === void 0) continue;
					if (typeof l == "object" && l.isEscaped)
						if (l.callbacks) r.unshift("", l);
						else {
							const f = l.toString();
							f instanceof Promise ? r.unshift("", f) : (r[0] += f);
						}
					else l instanceof Promise ? r.unshift("", l) : ie(l.toString(), r);
				}
			}
		}
		return (
			(r[0] += e.at(-1)),
			r.length === 1
				? "callbacks" in r
					? M(dr(M(r[0], r.callbacks)))
					: M(r[0])
				: hr(r, r.callbacks)
		);
	},
	Ot = Symbol("RENDERER"),
	mt = Symbol("ERROR_HANDLER"),
	A = Symbol("STASH"),
	gr = Symbol("INTERNAL"),
	nn = Symbol("MEMO"),
	rt = Symbol("PERMALINK"),
	Dt = (e) => ((e[gr] = !0), e),
	yr =
		(e) =>
		({ value: t, children: r }) => {
			if (!r) return;
			const n = {
				children: [
					{
						tag: Dt(() => {
							e.push(t);
						}),
						props: {},
					},
				],
			};
			Array.isArray(r) ? n.children.push(...r.flat()) : n.children.push(r),
				n.children.push({
					tag: Dt(() => {
						e.pop();
					}),
					props: {},
				});
			const s = { tag: "", props: n, type: "" };
			return (
				(s[mt] = (i) => {
					throw (e.pop(), i);
				}),
				s
			);
		},
	vr = (e) => {
		const t = [e],
			r = yr(t);
		return (r.values = t), (r.Provider = r), be.push(r), r;
	},
	be = [],
	mr = (e) => {
		const t = [e],
			r = (n) => {
				t.push(n.value);
				let s;
				try {
					s = n.children
						? (Array.isArray(n.children)
								? new Pr("", {}, n.children)
								: n.children
							).toString()
						: "";
				} finally {
					t.pop();
				}
				return s instanceof Promise ? s.then((i) => M(i, i.callbacks)) : M(s);
			};
		return (r.values = t), (r.Provider = r), (r[Ot] = yr(t)), be.push(r), r;
	},
	Se = (e) => e.values.at(-1),
	Ke = {
		title: [],
		script: ["src"],
		style: ["data-href"],
		link: ["href"],
		meta: ["name", "httpEquiv", "charset", "itemProp"],
	},
	wt = {},
	Ge = "data-precedence",
	Be = (e) => (Array.isArray(e) ? e : [e]),
	Ht = new WeakMap(),
	Mt =
		(e, t, r, n) =>
		({ buffer: s, context: i }) => {
			if (!s) return;
			const o = Ht.get(i) || {};
			Ht.set(i, o);
			const a = o[e] || (o[e] = []);
			let l = !1;
			const f = Ke[e];
			if (f.length > 0) {
				e: for (const [, u] of a)
					for (const h of f)
						if (
							((u == null ? void 0 : u[h]) ?? null) ===
							(r == null ? void 0 : r[h])
						) {
							l = !0;
							break e;
						}
			}
			if (
				(l
					? (s[0] = s[0].replaceAll(t, ""))
					: f.length > 0
						? a.push([t, r, n])
						: a.unshift([t, r, n]),
				s[0].indexOf("</head>") !== -1)
			) {
				let u;
				if (n === void 0) u = a.map(([h]) => h);
				else {
					const h = [];
					u = a
						.map(([d, , g]) => {
							let p = h.indexOf(g);
							return p === -1 && (h.push(g), (p = h.length - 1)), [d, p];
						})
						.sort((d, g) => d[1] - g[1])
						.map(([d]) => d);
				}
				u.forEach((h) => {
					s[0] = s[0].replaceAll(h, "");
				}),
					(s[0] = s[0].replace(/(?=<\/head>)/, u.join("")));
			}
		},
	Ue = (e, t, r) => M(new q(e, r, Be(t ?? [])).toString()),
	We = (e, t, r, n) => {
		if ("itemProp" in r) return Ue(e, t, r);
		let { precedence: s, blocking: i, ...o } = r;
		(s = n ? (s ?? "") : void 0), n && (o[Ge] = s);
		const a = new q(e, o, Be(t || [])).toString();
		return a instanceof Promise
			? a.then((l) => M(a, [...(l.callbacks || []), Mt(e, l, o, s)]))
			: M(a, [Mt(e, a, o, s)]);
	},
	sn = ({ children: e, ...t }) => {
		const r = St();
		if (r) {
			const n = Se(r);
			if (n === "svg" || n === "head") return new q("title", t, Be(e ?? []));
		}
		return We("title", e, t, !1);
	},
	on = ({ children: e, ...t }) => {
		const r = St();
		return ["src", "async"].some((n) => !t[n]) || (r && Se(r) === "head")
			? Ue("script", e, t)
			: We("script", e, t, !1);
	},
	an = ({ children: e, ...t }) =>
		["href", "precedence"].every((r) => r in t)
			? ((t["data-href"] = t.href), delete t.href, We("style", e, t, !0))
			: Ue("style", e, t),
	ln = ({ children: e, ...t }) =>
		["onLoad", "onError"].some((r) => r in t) ||
		(t.rel === "stylesheet" && (!("precedence" in t) || "disabled" in t))
			? Ue("link", e, t)
			: We("link", e, t, "precedence" in t),
	cn = ({ children: e, ...t }) => {
		const r = St();
		return r && Se(r) === "head" ? Ue("meta", e, t) : We("meta", e, t, !1);
	},
	wr = (e, { children: t, ...r }) => new q(e, r, Be(t ?? [])),
	fn = (e) => (
		typeof e.action == "function" &&
			(e.action = rt in e.action ? e.action[rt] : void 0),
		wr("form", e)
	),
	Er = (e, t) => (
		typeof t.formAction == "function" &&
			(t.formAction = rt in t.formAction ? t.formAction[rt] : void 0),
		wr(e, t)
	),
	un = (e) => Er("input", e),
	hn = (e) => Er("button", e);
const lt = Object.freeze(
	Object.defineProperty(
		{
			__proto__: null,
			button: hn,
			form: fn,
			input: un,
			link: ln,
			meta: cn,
			script: on,
			style: an,
			title: sn,
		},
		Symbol.toStringTag,
		{ value: "Module" },
	),
);
var dn = new Map([
		["className", "class"],
		["htmlFor", "for"],
		["crossOrigin", "crossorigin"],
		["httpEquiv", "http-equiv"],
		["itemProp", "itemprop"],
		["fetchPriority", "fetchpriority"],
		["noModule", "nomodule"],
		["formAction", "formaction"],
	]),
	nt = (e) => dn.get(e) || e,
	xr = (e, t) => {
		for (const [r, n] of Object.entries(e)) {
			const s =
				r[0] === "-" || !/[A-Z]/.test(r)
					? r
					: r.replace(/[A-Z]/g, (i) => `-${i.toLowerCase()}`);
			t(
				s,
				n == null
					? null
					: typeof n == "number"
						? s.match(
								/^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/,
							)
							? `${n}`
							: `${n}px`
						: n,
			);
		}
	},
	Le = void 0,
	St = () => Le,
	pn = (e) =>
		/[A-Z]/.test(e) &&
		e.match(
			/^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/,
		)
			? e.replace(/([A-Z])/g, "-$1").toLowerCase()
			: e,
	gn = [
		"area",
		"base",
		"br",
		"col",
		"embed",
		"hr",
		"img",
		"input",
		"keygen",
		"link",
		"meta",
		"param",
		"source",
		"track",
		"wbr",
	],
	yn = [
		"allowfullscreen",
		"async",
		"autofocus",
		"autoplay",
		"checked",
		"controls",
		"default",
		"defer",
		"disabled",
		"download",
		"formnovalidate",
		"hidden",
		"inert",
		"ismap",
		"itemscope",
		"loop",
		"multiple",
		"muted",
		"nomodule",
		"novalidate",
		"open",
		"playsinline",
		"readonly",
		"required",
		"reversed",
		"selected",
	],
	Ct = (e, t) => {
		for (let r = 0, n = e.length; r < n; r++) {
			const s = e[r];
			if (typeof s == "string") ie(s, t);
			else {
				if (typeof s == "boolean" || s === null || s === void 0) continue;
				s instanceof q
					? s.toStringToBuffer(t)
					: typeof s == "number" || s.isEscaped
						? (t[0] += s)
						: s instanceof Promise
							? t.unshift("", s)
							: Ct(s, t);
			}
		}
	},
	q = class {
		constructor(e, t, r) {
			w(this, "tag");
			w(this, "props");
			w(this, "key");
			w(this, "children");
			w(this, "isEscaped", !0);
			w(this, "localContexts");
			(this.tag = e), (this.props = t), (this.children = r);
		}
		get type() {
			return this.tag;
		}
		get ref() {
			return this.props.ref || null;
		}
		toString() {
			var t, r;
			const e = [""];
			(t = this.localContexts) == null ||
				t.forEach(([n, s]) => {
					n.values.push(s);
				});
			try {
				this.toStringToBuffer(e);
			} finally {
				(r = this.localContexts) == null ||
					r.forEach(([n]) => {
						n.values.pop();
					});
			}
			return e.length === 1
				? "callbacks" in e
					? dr(M(e[0], e.callbacks)).toString()
					: e[0]
				: hr(e, e.callbacks);
		}
		toStringToBuffer(e) {
			const t = this.tag,
				r = this.props;
			let { children: n } = this;
			e[0] += `<${t}`;
			const s = Le && Se(Le) === "svg" ? (i) => pn(nt(i)) : (i) => nt(i);
			for (let [i, o] of Object.entries(r))
				if (((i = s(i)), i !== "children")) {
					if (i === "style" && typeof o == "object") {
						let a = "";
						xr(o, (l, f) => {
							f != null && (a += `${a ? ";" : ""}${l}:${f}`);
						}),
							(e[0] += ' style="'),
							ie(a, e),
							(e[0] += '"');
					} else if (typeof o == "string")
						(e[0] += ` ${i}="`), ie(o, e), (e[0] += '"');
					else if (o != null)
						if (typeof o == "number" || o.isEscaped) e[0] += ` ${i}="${o}"`;
						else if (typeof o == "boolean" && yn.includes(i))
							o && (e[0] += ` ${i}=""`);
						else if (i === "dangerouslySetInnerHTML") {
							if (n.length > 0)
								throw "Can only set one of `children` or `props.dangerouslySetInnerHTML`.";
							n = [M(o.__html)];
						} else if (o instanceof Promise)
							(e[0] += ` ${i}="`), e.unshift('"', o);
						else if (typeof o == "function") {
							if (!i.startsWith("on"))
								throw `Invalid prop '${i}' of type 'function' supplied to '${t}'.`;
						} else (e[0] += ` ${i}="`), ie(o.toString(), e), (e[0] += '"');
				}
			if (gn.includes(t) && n.length === 0) {
				e[0] += "/>";
				return;
			}
			(e[0] += ">"), Ct(n, e), (e[0] += `</${t}>`);
		}
	},
	ct = class extends q {
		toStringToBuffer(e) {
			const { children: t } = this,
				r = this.tag.call(null, {
					...this.props,
					children: t.length <= 1 ? t[0] : t,
				});
			if (!(typeof r == "boolean" || r == null))
				if (r instanceof Promise)
					if (be.length === 0) e.unshift("", r);
					else {
						const n = be.map((s) => [s, s.values.at(-1)]);
						e.unshift(
							"",
							r.then((s) => (s instanceof q && (s.localContexts = n), s)),
						);
					}
				else
					r instanceof q
						? r.toStringToBuffer(e)
						: typeof r == "number" || r.isEscaped
							? ((e[0] += r),
								r.callbacks &&
									(e.callbacks || (e.callbacks = []),
									e.callbacks.push(...r.callbacks)))
							: ie(r, e);
		}
	},
	Pr = class extends q {
		toStringToBuffer(e) {
			Ct(this.children, e);
		}
	},
	It = (e, t, ...r) => {
		t ?? (t = {}), r.length && (t.children = r.length === 1 ? r[0] : r);
		const n = t.key;
		delete t.key;
		const s = Ze(e, t, r);
		return (s.key = n), s;
	},
	_t = !1,
	Ze = (e, t, r) => {
		if (!_t) {
			for (const n in wt) lt[n][Ot] = wt[n];
			_t = !0;
		}
		return typeof e == "function"
			? new ct(e, t, r)
			: lt[e]
				? new ct(lt[e], t, r)
				: e === "svg" || e === "head"
					? (Le || (Le = mr("")), new q(e, t, [new ct(Le, { value: e }, r)]))
					: new q(e, t, r);
	},
	vn = ({ children: e }) =>
		new Pr("", { children: e }, Array.isArray(e) ? e : e ? [e] : []);
function Ae(e, t, r) {
	let n;
	if (!t || !("children" in t)) n = Ze(e, t, []);
	else {
		const s = t.children;
		n = Array.isArray(s) ? Ze(e, t, s) : Ze(e, t, [s]);
	}
	return (n.key = r), n;
}
var Ne = "_hp",
	mn = { Change: "Input", DoubleClick: "DblClick" },
	wn = { svg: "2000/svg", math: "1998/Math/MathML" },
	De = [],
	Et = new WeakMap(),
	Re = void 0,
	En = () => Re,
	V = (e) => "t" in e,
	ft = { onClick: ["click", !1] },
	Ft = (e) => {
		if (!e.startsWith("on")) return;
		if (ft[e]) return ft[e];
		const t = e.match(/^on([A-Z][a-zA-Z]+?(?:PointerCapture)?)(Capture)?$/);
		if (t) {
			const [, r, n] = t;
			return (ft[e] = [(mn[r] || r).toLowerCase(), !!n]);
		}
	},
	qt = (e, t) =>
		Re &&
		e instanceof SVGElement &&
		/[A-Z]/.test(t) &&
		(t in e.style || t.match(/^(?:o|pai|str|u|ve)/))
			? t.replace(/([A-Z])/g, "-$1").toLowerCase()
			: t,
	xn = (e, t, r) => {
		var n;
		t || (t = {});
		for (let s in t) {
			const i = t[s];
			if (s !== "children" && (!r || r[s] !== i)) {
				s = nt(s);
				const o = Ft(s);
				if (o) {
					if (
						(r == null ? void 0 : r[s]) !== i &&
						(r && e.removeEventListener(o[0], r[s], o[1]), i != null)
					) {
						if (typeof i != "function")
							throw new Error(`Event handler for "${s}" is not a function`);
						e.addEventListener(o[0], i, o[1]);
					}
				} else if (s === "dangerouslySetInnerHTML" && i) e.innerHTML = i.__html;
				else if (s === "ref") {
					let a;
					typeof i == "function"
						? (a = i(e) || (() => i(null)))
						: i &&
							"current" in i &&
							((i.current = e), (a = () => (i.current = null))),
						Et.set(e, a);
				} else if (s === "style") {
					const a = e.style;
					typeof i == "string"
						? (a.cssText = i)
						: ((a.cssText = ""), i != null && xr(i, a.setProperty.bind(a)));
				} else {
					if (s === "value") {
						const l = e.nodeName;
						if (l === "INPUT" || l === "TEXTAREA" || l === "SELECT") {
							if (
								((e.value = i == null || i === !1 ? null : i), l === "TEXTAREA")
							) {
								e.textContent = i;
								continue;
							} else if (l === "SELECT") {
								e.selectedIndex === -1 && (e.selectedIndex = 0);
								continue;
							}
						}
					} else
						((s === "checked" && e.nodeName === "INPUT") ||
							(s === "selected" && e.nodeName === "OPTION")) &&
							(e[s] = i);
					const a = qt(e, s);
					i == null || i === !1
						? e.removeAttribute(a)
						: i === !0
							? e.setAttribute(a, "")
							: typeof i == "string" || typeof i == "number"
								? e.setAttribute(a, i)
								: e.setAttribute(a, i.toString());
				}
			}
		}
		if (r)
			for (let s in r) {
				const i = r[s];
				if (s !== "children" && !(s in t)) {
					s = nt(s);
					const o = Ft(s);
					o
						? e.removeEventListener(o[0], i, o[1])
						: s === "ref"
							? (n = Et.get(e)) == null || n()
							: e.removeAttribute(qt(e, s));
				}
			}
	},
	Pn = (e, t) => {
		(t[A][0] = 0), De.push([e, t]);
		const r = t.tag[Ot] || t.tag,
			n = r.defaultProps ? { ...r.defaultProps, ...t.props } : t.props;
		try {
			return [r.call(null, n)];
		} finally {
			De.pop();
		}
	},
	br = (e, t, r, n, s) => {
		var i, o;
		(i = e.vR) != null && i.length && (n.push(...e.vR), delete e.vR),
			typeof e.tag == "function" &&
				((o = e[A][1][Cr]) == null || o.forEach((a) => s.push(a))),
			e.vC.forEach((a) => {
				var l;
				if (V(a)) r.push(a);
				else if (typeof a.tag == "function" || a.tag === "") {
					a.c = t;
					const f = r.length;
					if ((br(a, t, r, n, s), a.s)) {
						for (let u = f; u < r.length; u++) r[u].s = !0;
						a.s = !1;
					}
				} else
					r.push(a),
						(l = a.vR) != null && l.length && (n.push(...a.vR), delete a.vR);
			});
	},
	bn = (e) => {
		for (; ; e = e.tag === Ne || !e.vC || !e.pP ? e.nN : e.vC[0]) {
			if (!e) return null;
			if (e.tag !== Ne && e.e) return e.e;
		}
	},
	Rr = (e) => {
		var t, r, n, s, i, o;
		V(e) ||
			((r = (t = e[A]) == null ? void 0 : t[1][Cr]) == null ||
				r.forEach((a) => {
					var l;
					return (l = a[2]) == null ? void 0 : l.call(a);
				}),
			(n = Et.get(e.e)) == null || n(),
			e.p === 2 && ((s = e.vC) == null || s.forEach((a) => (a.p = 2))),
			(i = e.vC) == null || i.forEach(Rr)),
			e.p || ((o = e.e) == null || o.remove(), delete e.e),
			typeof e.tag == "function" &&
				($e.delete(e), Je.delete(e), delete e[A][3], (e.a = !0));
	},
	Or = (e, t, r) => {
		(e.c = t), Sr(e, t, r);
	},
	Bt = (e, t) => {
		if (t) {
			for (let r = 0, n = e.length; r < n; r++) if (e[r] === t) return r;
		}
	},
	Ut = Symbol(),
	Sr = (e, t, r) => {
		var f;
		const n = [],
			s = [],
			i = [];
		br(e, t, n, s, i), s.forEach(Rr);
		const o = r ? void 0 : t.childNodes;
		let a,
			l = null;
		if (r) a = -1;
		else if (!o.length) a = 0;
		else {
			const u = Bt(o, bn(e.nN));
			u !== void 0
				? ((l = o[u]), (a = u))
				: (a =
						Bt(
							o,
							(f = n.find((h) => h.tag !== Ne && h.e)) == null ? void 0 : f.e,
						) ?? -1),
				a === -1 && (r = !0);
		}
		for (let u = 0, h = n.length; u < h; u++, a++) {
			const d = n[u];
			let g;
			if (d.s && d.e) (g = d.e), (d.s = !1);
			else {
				const p = r || !d.e;
				V(d)
					? (d.e && d.d && (d.e.textContent = d.t),
						(d.d = !1),
						(g = d.e || (d.e = document.createTextNode(d.t))))
					: ((g =
							d.e ||
							(d.e = d.n
								? document.createElementNS(d.n, d.tag)
								: document.createElement(d.tag))),
						xn(g, d.props, d.pP),
						Sr(d, g, p));
			}
			d.tag === Ne
				? a--
				: r
					? g.parentNode || t.appendChild(g)
					: o[a] !== g &&
						o[a - 1] !== g &&
						(o[a + 1] === g
							? t.appendChild(o[a])
							: t.insertBefore(g, l || o[a] || null));
		}
		if ((e.pP && delete e.pP, i.length)) {
			const u = [],
				h = [];
			i.forEach(([, d, , g, p]) => {
				d && u.push(d), g && h.push(g), p == null || p();
			}),
				u.forEach((d) => d()),
				h.length &&
					requestAnimationFrame(() => {
						h.forEach((d) => d());
					});
		}
	},
	Rn = (e, t) =>
		!!(e && e.length === t.length && e.every((r, n) => r[1] === t[n][1])),
	Je = new WeakMap(),
	xt = (e, t, r) => {
		var i, o, a, l, f, u;
		const n = !r && t.pC;
		r && (t.pC || (t.pC = t.vC));
		let s;
		try {
			r || (r = typeof t.tag == "function" ? Pn(e, t) : Be(t.props.children)),
				((i = r[0]) == null ? void 0 : i.tag) === "" &&
					r[0][mt] &&
					((s = r[0][mt]), e[5].push([e, s, t]));
			const h = n ? [...t.pC] : t.vC ? [...t.vC] : void 0,
				d = [];
			let g;
			for (let p = 0; p < r.length; p++) {
				Array.isArray(r[p]) && r.splice(p, 1, ...r[p].flat());
				let m = On(r[p]);
				if (m) {
					typeof m.tag == "function" &&
						!m.tag[gr] &&
						(be.length > 0 && (m[A][2] = be.map((E) => [E, E.values.at(-1)])),
						(o = e[5]) != null && o.length && (m[A][3] = e[5].at(-1)));
					let y;
					if (h && h.length) {
						const E = h.findIndex(
							V(m)
								? (x) => V(x)
								: m.key !== void 0
									? (x) => x.key === m.key && x.tag === m.tag
									: (x) => x.tag === m.tag,
						);
						E !== -1 && ((y = h[E]), h.splice(E, 1));
					}
					if (y)
						if (V(m)) y.t !== m.t && ((y.t = m.t), (y.d = !0)), (m = y);
						else {
							const E = (y.pP = y.props);
							if (
								((y.props = m.props),
								y.f || (y.f = m.f || t.f),
								typeof m.tag == "function")
							) {
								const x = y[A][2];
								(y[A][2] = m[A][2] || []),
									(y[A][3] = m[A][3]),
									!y.f &&
										((y.o || y) === m.o ||
											((l = (a = y.tag)[nn]) != null &&
												l.call(a, E, y.props))) &&
										Rn(x, y[A][2]) &&
										(y.s = !0);
							}
							m = y;
						}
					else if (!V(m) && Re) {
						const E = Se(Re);
						E && (m.n = E);
					}
					if (
						(!V(m) && !m.s && (xt(e, m), delete m.f),
						d.push(m),
						g && !g.s && !m.s)
					)
						for (
							let E = g;
							E && !V(E);
							E = (f = E.vC) == null ? void 0 : f.at(-1)
						)
							E.nN = m;
					g = m;
				}
			}
			(t.vR = n ? [...t.vC, ...(h || [])] : h || []),
				(t.vC = d),
				n && delete t.pC;
		} catch (h) {
			if (((t.f = !0), h === Ut)) {
				if (s) return;
				throw h;
			}
			const [d, g, p] = ((u = t[A]) == null ? void 0 : u[3]) || [];
			if (g) {
				const m = () => Qe([0, !1, e[2]], p),
					y = Je.get(p) || [];
				y.push(m), Je.set(p, y);
				const E = g(h, () => {
					const x = Je.get(p);
					if (x) {
						const R = x.indexOf(m);
						if (R !== -1) return x.splice(R, 1), m();
					}
				});
				if (E) {
					if (e[0] === 1) e[1] = !0;
					else if ((xt(e, p, [E]), (g.length === 1 || e !== d) && p.c)) {
						Or(p, p.c, !1);
						return;
					}
					throw Ut;
				}
			}
			throw h;
		} finally {
			s && e[5].pop();
		}
	},
	On = (e) => {
		if (!(e == null || typeof e == "boolean")) {
			if (typeof e == "string" || typeof e == "number")
				return { t: e.toString(), d: !0 };
			if (
				("vR" in e &&
					(e = {
						tag: e.tag,
						props: e.props,
						key: e.key,
						f: e.f,
						type: e.tag,
						ref: e.props.ref,
						o: e.o || e,
					}),
				typeof e.tag == "function")
			)
				e[A] = [0, []];
			else {
				const t = wn[e.tag];
				t &&
					(Re || (Re = vr("")),
					(e.props.children = [
						{
							tag: Re,
							props: {
								value: (e.n = `http://www.w3.org/${t}`),
								children: e.props.children,
							},
						},
					]));
			}
			return e;
		}
	},
	Wt = (e, t) => {
		var r, n;
		(r = t[A][2]) == null ||
			r.forEach(([s, i]) => {
				s.values.push(i);
			});
		try {
			xt(e, t, void 0);
		} catch {
			return;
		}
		if (t.a) {
			delete t.a;
			return;
		}
		(n = t[A][2]) == null ||
			n.forEach(([s]) => {
				s.values.pop();
			}),
			(e[0] !== 1 || !e[1]) && Or(t, t.c, !1);
	},
	$e = new WeakMap(),
	Vt = [],
	Qe = async (e, t) => {
		e[5] || (e[5] = []);
		const r = $e.get(t);
		r && r[0](void 0);
		let n;
		const s = new Promise((i) => (n = i));
		if (
			($e.set(t, [
				n,
				() => {
					e[2]
						? e[2](e, t, (i) => {
								Wt(i, t);
							}).then(() => n(t))
						: (Wt(e, t), n(t));
				},
			]),
			Vt.length)
		)
			Vt.at(-1).add(t);
		else {
			await Promise.resolve();
			const i = $e.get(t);
			i && ($e.delete(t), i[1]());
		}
		return s;
	},
	Sn = (e, t, r) => ({ tag: Ne, props: { children: e }, key: r, e: t, p: 1 }),
	ut = 0,
	Cr = 1,
	ht = 2,
	dt = 3,
	pt = new WeakMap(),
	Ar = (e, t) =>
		!e || !t || e.length !== t.length || t.some((r, n) => r !== e[n]),
	Cn = void 0,
	Xt = [],
	An = (e) => {
		var o;
		const t = () => (typeof e == "function" ? e() : e),
			r = De.at(-1);
		if (!r) return [t(), () => {}];
		const [, n] = r,
			s = (o = n[A][1])[ut] || (o[ut] = []),
			i = n[A][0]++;
		return (
			s[i] ||
			(s[i] = [
				t(),
				(a) => {
					const l = Cn,
						f = s[i];
					if ((typeof a == "function" && (a = a(f[0])), !Object.is(a, f[0])))
						if (((f[0] = a), Xt.length)) {
							const [u, h] = Xt.at(-1);
							Promise.all([u === 3 ? n : Qe([u, !1, l], n), h]).then(([d]) => {
								if (!d || !(u === 2 || u === 3)) return;
								const g = d.vC;
								requestAnimationFrame(() => {
									setTimeout(() => {
										g === d.vC && Qe([u === 3 ? 1 : 0, !1, l], d);
									});
								});
							});
						} else Qe([0, !1, l], n);
				},
			])
		);
	},
	At = (e, t) => {
		var a;
		const r = De.at(-1);
		if (!r) return e;
		const [, n] = r,
			s = (a = n[A][1])[ht] || (a[ht] = []),
			i = n[A][0]++,
			o = s[i];
		return (
			Ar(o == null ? void 0 : o[1], t) ? (s[i] = [e, t]) : (e = s[i][0]), e
		);
	},
	$n = (e) => {
		const t = pt.get(e);
		if (t) {
			if (t.length === 2) throw t[1];
			return t[0];
		}
		throw (
			(e.then(
				(r) => pt.set(e, [r]),
				(r) => pt.set(e, [void 0, r]),
			),
			e)
		);
	},
	jn = (e, t) => {
		var a;
		const r = De.at(-1);
		if (!r) return e();
		const [, n] = r,
			s = (a = n[A][1])[dt] || (a[dt] = []),
			i = n[A][0]++,
			o = s[i];
		return Ar(o == null ? void 0 : o[1], t) && (s[i] = [e(), t]), s[i][0];
	},
	Tn = vr({ pending: !1, data: null, method: null, action: null }),
	zt = new Set(),
	kn = (e) => {
		zt.add(e), e.finally(() => zt.delete(e));
	},
	$t = (e, t) =>
		jn(
			() => (r) => {
				let n;
				e &&
					(typeof e == "function"
						? (n =
								e(r) ||
								(() => {
									e(null);
								}))
						: e &&
							"current" in e &&
							((e.current = r),
							(n = () => {
								e.current = null;
							})));
				const s = t(r);
				return () => {
					s == null || s(), n == null || n();
				};
			},
			[e],
		),
	ge = Object.create(null),
	Xe = Object.create(null),
	Ve = (e, t, r, n, s) => {
		if (t != null && t.itemProp)
			return { tag: e, props: t, type: e, ref: t.ref };
		const i = document.head;
		let { onLoad: o, onError: a, precedence: l, blocking: f, ...u } = t,
			h = null,
			d = !1;
		const g = Ke[e];
		let p;
		if (g.length > 0) {
			const x = i.querySelectorAll(e);
			e: for (const R of x)
				for (const O of Ke[e])
					if (R.getAttribute(O) === t[O]) {
						h = R;
						break e;
					}
			if (!h) {
				const R = g.reduce(
					(O, S) => (t[S] === void 0 ? O : `${O}-${S}-${t[S]}`),
					e,
				);
				(d = !Xe[R]),
					(h =
						Xe[R] ||
						(Xe[R] = (() => {
							const O = document.createElement(e);
							for (const S of g)
								t[S] !== void 0 && O.setAttribute(S, t[S]),
									t.rel && O.setAttribute("rel", t.rel);
							return O;
						})()));
			}
		} else p = i.querySelectorAll(e);
		(l = n ? (l ?? "") : void 0), n && (u[Ge] = l);
		const m = At(
				(x) => {
					if (g.length > 0) {
						let R = !1;
						for (const O of i.querySelectorAll(e)) {
							if (R && O.getAttribute(Ge) !== l) {
								i.insertBefore(x, O);
								return;
							}
							O.getAttribute(Ge) === l && (R = !0);
						}
						i.appendChild(x);
					} else if (p) {
						let R = !1;
						for (const O of p)
							if (O === x) {
								R = !0;
								break;
							}
						R ||
							i.insertBefore(x, i.contains(p[0]) ? p[0] : i.querySelector(e)),
							(p = void 0);
					}
				},
				[l],
			),
			y = $t(t.ref, (x) => {
				var S;
				const R = g[0];
				if ((r === 2 && (x.innerHTML = ""), (d || p) && m(x), !a && !o)) return;
				let O =
					ge[(S = x.getAttribute(R))] ||
					(ge[S] = new Promise((oe, ae) => {
						x.addEventListener("load", oe), x.addEventListener("error", ae);
					}));
				o && (O = O.then(o)), a && (O = O.catch(a)), O.catch(() => {});
			});
		if (s && f === "render") {
			const x = Ke[e][0];
			if (t[x]) {
				const R = t[x],
					O =
						ge[R] ||
						(ge[R] = new Promise((S, oe) => {
							m(h),
								h.addEventListener("load", S),
								h.addEventListener("error", oe);
						}));
				$n(O);
			}
		}
		const E = { tag: e, type: e, props: { ...u, ref: y }, ref: y };
		return (E.p = r), h && (E.e = h), Sn(E, i);
	},
	Ln = (e) => {
		const t = En(),
			r = t && Se(t);
		return r != null && r.endsWith("svg")
			? { tag: "title", props: e, type: "title", ref: e.ref }
			: Ve("title", e, void 0, !1, !1);
	},
	Nn = (e) =>
		!e || ["src", "async"].some((t) => !e[t])
			? { tag: "script", props: e, type: "script", ref: e.ref }
			: Ve("script", e, 1, !1, !0),
	Dn = (e) =>
		!e || !["href", "precedence"].every((t) => t in e)
			? { tag: "style", props: e, type: "style", ref: e.ref }
			: ((e["data-href"] = e.href), delete e.href, Ve("style", e, 2, !0, !0)),
	Hn = (e) =>
		!e ||
		["onLoad", "onError"].some((t) => t in e) ||
		(e.rel === "stylesheet" && (!("precedence" in e) || "disabled" in e))
			? { tag: "link", props: e, type: "link", ref: e.ref }
			: Ve("link", e, 1, "precedence" in e, !0),
	Mn = (e) => Ve("meta", e, void 0, !1, !1),
	$r = Symbol(),
	In = (e) => {
		const { action: t, ...r } = e;
		typeof t != "function" && (r.action = t);
		const [n, s] = An([null, !1]),
			i = At(async (f) => {
				const u = f.isTrusted ? t : f.detail[$r];
				if (typeof u != "function") return;
				f.preventDefault();
				const h = new FormData(f.target);
				s([h, !0]);
				const d = u(h);
				d instanceof Promise && (kn(d), await d), s([null, !0]);
			}, []),
			o = $t(
				e.ref,
				(f) => (
					f.addEventListener("submit", i),
					() => {
						f.removeEventListener("submit", i);
					}
				),
			),
			[a, l] = n;
		return (
			(n[1] = !1),
			{
				tag: Tn,
				props: {
					value: {
						pending: a !== null,
						data: a,
						method: a ? "post" : null,
						action: a ? t : null,
					},
					children: {
						tag: "form",
						props: { ...r, ref: o },
						type: "form",
						ref: o,
					},
				},
				f: l,
			}
		);
	},
	jr = (e, { formAction: t, ...r }) => {
		if (typeof t == "function") {
			const n = At((s) => {
				s.preventDefault(),
					s.currentTarget.form.dispatchEvent(
						new CustomEvent("submit", { detail: { [$r]: t } }),
					);
			}, []);
			r.ref = $t(
				r.ref,
				(s) => (
					s.addEventListener("click", n),
					() => {
						s.removeEventListener("click", n);
					}
				),
			);
		}
		return { tag: e, props: r, type: e, ref: r.ref };
	},
	_n = (e) => jr("input", e),
	Fn = (e) => jr("button", e);
Object.assign(wt, {
	title: Ln,
	script: Nn,
	style: Dn,
	link: Hn,
	meta: Mn,
	form: In,
	input: _n,
	button: Fn,
});
new TextEncoder();
var qn = mr(null),
	Bn = (e, t, r, n) => (s, i) => {
		const o = "<!DOCTYPE html>",
			a = r ? It((f) => r(f, e), { Layout: t, ...i }, s) : s,
			l = rn`${M(o)}${It(qn.Provider, { value: e }, a)}`;
		return e.html(l);
	},
	Un = (e, t) =>
		function (n, s) {
			const i = n.getLayout() ?? vn;
			return (
				e && n.setLayout((o) => e({ ...o, Layout: i }, n)),
				n.setRenderer(Bn(n, i, e)),
				s()
			);
		};
const Wn = Un(({ children: e }) =>
	Ae("html", {
		children: [
			Ae("head", {
				children: Ae("link", { href: "/assets/style.css", rel: "stylesheet" }),
			}),
			Ae("body", { children: e }),
		],
	}),
);
var Kt = (e, t, r) => (n, s) => {
		let i = -1;
		return o(0);
		async function o(a) {
			if (a <= i) throw new Error("next() called multiple times");
			i = a;
			let l,
				f = !1,
				u;
			if (
				(e[a]
					? ((u = e[a][0][0]), (n.req.routeIndex = a))
					: (u = (a === e.length && s) || void 0),
				u)
			)
				try {
					l = await u(n, () => o(a + 1));
				} catch (h) {
					if (h instanceof Error && t)
						(n.error = h), (l = await t(h, n)), (f = !0);
					else throw h;
				}
			else n.finalized === !1 && r && (l = await r(n));
			return l && (n.finalized === !1 || f) && (n.res = l), n;
		}
	},
	Vn = async (e, t = Object.create(null)) => {
		const { all: r = !1, dot: n = !1 } = t,
			i = (e instanceof Hr ? e.raw.headers : e.headers).get("Content-Type");
		return (i != null && i.startsWith("multipart/form-data")) ||
			(i != null && i.startsWith("application/x-www-form-urlencoded"))
			? Xn(e, { all: r, dot: n })
			: {};
	};
async function Xn(e, t) {
	const r = await e.formData();
	return r ? zn(r, t) : {};
}
function zn(e, t) {
	const r = Object.create(null);
	return (
		e.forEach((n, s) => {
			t.all || s.endsWith("[]") ? Kn(r, s, n) : (r[s] = n);
		}),
		t.dot &&
			Object.entries(r).forEach(([n, s]) => {
				n.includes(".") && (Gn(r, n, s), delete r[n]);
			}),
		r
	);
}
var Kn = (e, t, r) => {
		e[t] !== void 0
			? Array.isArray(e[t])
				? e[t].push(r)
				: (e[t] = [e[t], r])
			: (e[t] = r);
	},
	Gn = (e, t, r) => {
		let n = e;
		const s = t.split(".");
		s.forEach((i, o) => {
			o === s.length - 1
				? (n[i] = r)
				: ((!n[i] ||
						typeof n[i] != "object" ||
						Array.isArray(n[i]) ||
						n[i] instanceof File) &&
						(n[i] = Object.create(null)),
					(n = n[i]));
		});
	},
	Tr = (e) => {
		const t = e.split("/");
		return t[0] === "" && t.shift(), t;
	},
	Zn = (e) => {
		const { groups: t, path: r } = Jn(e),
			n = Tr(r);
		return Qn(n, t);
	},
	Jn = (e) => {
		const t = [];
		return (
			(e = e.replace(/\{[^}]+\}/g, (r, n) => {
				const s = `@${n}`;
				return t.push([s, r]), s;
			})),
			{ groups: t, path: e }
		);
	},
	Qn = (e, t) => {
		for (let r = t.length - 1; r >= 0; r--) {
			const [n] = t[r];
			for (let s = e.length - 1; s >= 0; s--)
				if (e[s].includes(n)) {
					e[s] = e[s].replace(n, t[r][1]);
					break;
				}
		}
		return e;
	},
	ze = {},
	Gt = (e, t) => {
		if (e === "*") return "*";
		const r = e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
		if (r) {
			const n = `${e}#${t}`;
			return (
				ze[n] ||
					(r[2]
						? (ze[n] =
								t && t[0] !== ":" && t[0] !== "*"
									? [n, r[1], new RegExp(`^${r[2]}(?=/${t})`)]
									: [e, r[1], new RegExp(`^${r[2]}$`)])
						: (ze[n] = [e, r[1], !0])),
				ze[n]
			);
		}
		return null;
	},
	kr = (e, t) => {
		try {
			return t(e);
		} catch {
			return e.replace(/(?:%[0-9A-Fa-f]{2})+/g, (r) => {
				try {
					return t(r);
				} catch {
					return r;
				}
			});
		}
	},
	Yn = (e) => kr(e, decodeURI),
	Lr = (e) => {
		const t = e.url,
			r = t.indexOf("/", 8);
		let n = r;
		for (; n < t.length; n++) {
			const s = t.charCodeAt(n);
			if (s === 37) {
				const i = t.indexOf("?", n),
					o = t.slice(r, i === -1 ? void 0 : i);
				return Yn(o.includes("%25") ? o.replace(/%25/g, "%2525") : o);
			} else if (s === 63) break;
		}
		return t.slice(r, n);
	},
	es = (e) => {
		const t = Lr(e);
		return t.length > 1 && t.at(-1) === "/" ? t.slice(0, -1) : t;
	},
	ve = (e, t, ...r) => (
		r.length && (t = ve(t, ...r)),
		`${(e == null ? void 0 : e[0]) === "/" ? "" : "/"}${e}${t === "/" ? "" : `${(e == null ? void 0 : e.at(-1)) === "/" ? "" : "/"}${(t == null ? void 0 : t[0]) === "/" ? t.slice(1) : t}`}`
	),
	jt = (e) => {
		if (e.charCodeAt(e.length - 1) !== 63 || !e.includes(":")) return null;
		const t = e.split("/"),
			r = [];
		let n = "";
		return (
			t.forEach((s) => {
				if (s !== "" && !/\:/.test(s)) n += "/" + s;
				else if (/\:/.test(s))
					if (/\?/.test(s)) {
						r.length === 0 && n === "" ? r.push("/") : r.push(n);
						const i = s.replace("?", "");
						(n += "/" + i), r.push(n);
					} else n += "/" + s;
			}),
			r.filter((s, i, o) => o.indexOf(s) === i)
		);
	},
	gt = (e) =>
		/[%+]/.test(e)
			? (e.indexOf("+") !== -1 && (e = e.replace(/\+/g, " ")),
				e.indexOf("%") !== -1 ? Dr(e) : e)
			: e,
	Nr = (e, t, r) => {
		let n;
		if (!r && t && !/[%+]/.test(t)) {
			let o = e.indexOf(`?${t}`, 8);
			for (o === -1 && (o = e.indexOf(`&${t}`, 8)); o !== -1; ) {
				const a = e.charCodeAt(o + t.length + 1);
				if (a === 61) {
					const l = o + t.length + 2,
						f = e.indexOf("&", l);
					return gt(e.slice(l, f === -1 ? void 0 : f));
				} else if (a == 38 || isNaN(a)) return "";
				o = e.indexOf(`&${t}`, o + 1);
			}
			if (((n = /[%+]/.test(e)), !n)) return;
		}
		const s = {};
		n ?? (n = /[%+]/.test(e));
		let i = e.indexOf("?", 8);
		for (; i !== -1; ) {
			const o = e.indexOf("&", i + 1);
			let a = e.indexOf("=", i);
			a > o && o !== -1 && (a = -1);
			let l = e.slice(i + 1, a === -1 ? (o === -1 ? void 0 : o) : a);
			if ((n && (l = gt(l)), (i = o), l === "")) continue;
			let f;
			a === -1
				? (f = "")
				: ((f = e.slice(a + 1, o === -1 ? void 0 : o)), n && (f = gt(f))),
				r
					? ((s[l] && Array.isArray(s[l])) || (s[l] = []), s[l].push(f))
					: (s[l] ?? (s[l] = f));
		}
		return t ? s[t] : s;
	},
	ts = Nr,
	rs = (e, t) => Nr(e, t, !0),
	Dr = decodeURIComponent,
	Zt = (e) => kr(e, Dr),
	me,
	I,
	Q,
	Mr,
	Ir,
	Pt,
	ee,
	tr,
	Hr =
		((tr = class {
			constructor(e, t = "/", r = [[]]) {
				P(this, Q);
				w(this, "raw");
				P(this, me);
				P(this, I);
				w(this, "routeIndex", 0);
				w(this, "path");
				w(this, "bodyCache", {});
				P(this, ee, (e) => {
					const { bodyCache: t, raw: r } = this,
						n = t[e];
					if (n) return n;
					const s = Object.keys(t)[0];
					return s
						? t[s].then(
								(i) => (
									s === "json" && (i = JSON.stringify(i)), new Response(i)[e]()
								),
							)
						: (t[e] = r[e]());
				});
				(this.raw = e), (this.path = t), v(this, I, r), v(this, me, {});
			}
			param(e) {
				return e ? b(this, Q, Mr).call(this, e) : b(this, Q, Ir).call(this);
			}
			query(e) {
				return ts(this.url, e);
			}
			queries(e) {
				return rs(this.url, e);
			}
			header(e) {
				if (e) return this.raw.headers.get(e) ?? void 0;
				const t = {};
				return (
					this.raw.headers.forEach((r, n) => {
						t[n] = r;
					}),
					t
				);
			}
			async parseBody(e) {
				var t;
				return (
					(t = this.bodyCache).parsedBody ?? (t.parsedBody = await Vn(this, e))
				);
			}
			json() {
				return c(this, ee).call(this, "json");
			}
			text() {
				return c(this, ee).call(this, "text");
			}
			arrayBuffer() {
				return c(this, ee).call(this, "arrayBuffer");
			}
			blob() {
				return c(this, ee).call(this, "blob");
			}
			formData() {
				return c(this, ee).call(this, "formData");
			}
			addValidatedData(e, t) {
				c(this, me)[e] = t;
			}
			valid(e) {
				return c(this, me)[e];
			}
			get url() {
				return this.raw.url;
			}
			get method() {
				return this.raw.method;
			}
			get matchedRoutes() {
				return c(this, I)[0].map(([[, e]]) => e);
			}
			get routePath() {
				return c(this, I)[0].map(([[, e]]) => e)[this.routeIndex].path;
			}
		}),
		(me = new WeakMap()),
		(I = new WeakMap()),
		(Q = new WeakSet()),
		(Mr = function (e) {
			const t = c(this, I)[0][this.routeIndex][1][e],
				r = b(this, Q, Pt).call(this, t);
			return r ? (/\%/.test(r) ? Zt(r) : r) : void 0;
		}),
		(Ir = function () {
			const e = {},
				t = Object.keys(c(this, I)[0][this.routeIndex][1]);
			for (const r of t) {
				const n = b(this, Q, Pt).call(
					this,
					c(this, I)[0][this.routeIndex][1][r],
				);
				n && typeof n == "string" && (e[r] = /\%/.test(n) ? Zt(n) : n);
			}
			return e;
		}),
		(Pt = function (e) {
			return c(this, I)[1] ? c(this, I)[1][e] : e;
		}),
		(ee = new WeakMap()),
		tr),
	ns = "text/plain; charset=UTF-8",
	yt = (e, t = {}) => {
		for (const r of Object.keys(t)) e.set(r, t[r]);
		return e;
	},
	He,
	Me,
	X,
	fe,
	z,
	C,
	$,
	D,
	K,
	Ie,
	we,
	Ee,
	_e,
	Fe,
	N,
	H,
	rr,
	ss =
		((rr = class {
			constructor(e, t) {
				P(this, N);
				P(this, He);
				P(this, Me);
				w(this, "env", {});
				P(this, X);
				w(this, "finalized", !1);
				w(this, "error");
				P(this, fe, 200);
				P(this, z);
				P(this, C);
				P(this, $);
				P(this, D);
				P(this, K, !0);
				P(this, Ie);
				P(this, we);
				P(this, Ee);
				P(this, _e);
				P(this, Fe);
				w(
					this,
					"render",
					(...e) => (
						c(this, we) ?? v(this, we, (t) => this.html(t)),
						c(this, we).call(this, ...e)
					),
				);
				w(this, "setLayout", (e) => v(this, Ie, e));
				w(this, "getLayout", () => c(this, Ie));
				w(this, "setRenderer", (e) => {
					v(this, we, e);
				});
				w(this, "header", (e, t, r) => {
					if (
						(this.finalized &&
							v(this, D, new Response(c(this, D).body, c(this, D))),
						t === void 0)
					) {
						c(this, C)
							? c(this, C).delete(e)
							: c(this, $) && delete c(this, $)[e.toLocaleLowerCase()],
							this.finalized && this.res.headers.delete(e);
						return;
					}
					r != null && r.append
						? (c(this, C) ||
								(v(this, K, !1),
								v(this, C, new Headers(c(this, $))),
								v(this, $, {})),
							c(this, C).append(e, t))
						: c(this, C)
							? c(this, C).set(e, t)
							: (c(this, $) ?? v(this, $, {}),
								(c(this, $)[e.toLowerCase()] = t)),
						this.finalized &&
							(r != null && r.append
								? this.res.headers.append(e, t)
								: this.res.headers.set(e, t));
				});
				w(this, "status", (e) => {
					v(this, K, !1), v(this, fe, e);
				});
				w(this, "set", (e, t) => {
					c(this, X) ?? v(this, X, new Map()), c(this, X).set(e, t);
				});
				w(this, "get", (e) => (c(this, X) ? c(this, X).get(e) : void 0));
				w(this, "newResponse", (...e) => b(this, N, H).call(this, ...e));
				w(this, "body", (e, t, r) =>
					typeof t == "number"
						? b(this, N, H).call(this, e, t, r)
						: b(this, N, H).call(this, e, t),
				);
				w(this, "text", (e, t, r) => {
					if (!c(this, $)) {
						if (c(this, K) && !r && !t) return new Response(e);
						v(this, $, {});
					}
					return (
						(c(this, $)["content-type"] = ns),
						typeof t == "number"
							? b(this, N, H).call(this, e, t, r)
							: b(this, N, H).call(this, e, t)
					);
				});
				w(this, "json", (e, t, r) => {
					const n = JSON.stringify(e);
					return (
						c(this, $) ?? v(this, $, {}),
						(c(this, $)["content-type"] = "application/json"),
						typeof t == "number"
							? b(this, N, H).call(this, n, t, r)
							: b(this, N, H).call(this, n, t)
					);
				});
				w(
					this,
					"html",
					(e, t, r) => (
						c(this, $) ?? v(this, $, {}),
						(c(this, $)["content-type"] = "text/html; charset=UTF-8"),
						typeof e == "object"
							? pr(e, ur.Stringify, !1, {}).then((n) =>
									typeof t == "number"
										? b(this, N, H).call(this, n, t, r)
										: b(this, N, H).call(this, n, t),
								)
							: typeof t == "number"
								? b(this, N, H).call(this, e, t, r)
								: b(this, N, H).call(this, e, t)
					),
				);
				w(
					this,
					"redirect",
					(e, t) => (
						c(this, C) ?? v(this, C, new Headers()),
						c(this, C).set("Location", String(e)),
						this.newResponse(null, t ?? 302)
					),
				);
				w(
					this,
					"notFound",
					() => (
						c(this, Ee) ?? v(this, Ee, () => new Response()),
						c(this, Ee).call(this, this)
					),
				);
				v(this, He, e),
					t &&
						(v(this, z, t.executionCtx),
						(this.env = t.env),
						v(this, Ee, t.notFoundHandler),
						v(this, Fe, t.path),
						v(this, _e, t.matchResult));
			}
			get req() {
				return (
					c(this, Me) ??
						v(this, Me, new Hr(c(this, He), c(this, Fe), c(this, _e))),
					c(this, Me)
				);
			}
			get event() {
				if (c(this, z) && "respondWith" in c(this, z)) return c(this, z);
				throw Error("This context has no FetchEvent");
			}
			get executionCtx() {
				if (c(this, z)) return c(this, z);
				throw Error("This context has no ExecutionContext");
			}
			get res() {
				return (
					v(this, K, !1),
					c(this, D) ||
						v(this, D, new Response("404 Not Found", { status: 404 }))
				);
			}
			set res(e) {
				if ((v(this, K, !1), c(this, D) && e)) {
					e = new Response(e.body, e);
					for (const [t, r] of c(this, D).headers.entries())
						if (t !== "content-type")
							if (t === "set-cookie") {
								const n = c(this, D).headers.getSetCookie();
								e.headers.delete("set-cookie");
								for (const s of n) e.headers.append("set-cookie", s);
							} else e.headers.set(t, r);
				}
				v(this, D, e), (this.finalized = !0);
			}
			get var() {
				return c(this, X) ? Object.fromEntries(c(this, X)) : {};
			}
		}),
		(He = new WeakMap()),
		(Me = new WeakMap()),
		(X = new WeakMap()),
		(fe = new WeakMap()),
		(z = new WeakMap()),
		(C = new WeakMap()),
		($ = new WeakMap()),
		(D = new WeakMap()),
		(K = new WeakMap()),
		(Ie = new WeakMap()),
		(we = new WeakMap()),
		(Ee = new WeakMap()),
		(_e = new WeakMap()),
		(Fe = new WeakMap()),
		(N = new WeakSet()),
		(H = function (e, t, r) {
			if (c(this, K) && !r && !t && c(this, fe) === 200)
				return new Response(e, { headers: c(this, $) });
			if (t && typeof t != "number") {
				const s = new Headers(t.headers);
				c(this, C) &&
					c(this, C).forEach((o, a) => {
						a === "set-cookie" ? s.append(a, o) : s.set(a, o);
					});
				const i = yt(s, c(this, $));
				return new Response(e, { headers: i, status: t.status ?? c(this, fe) });
			}
			const n = typeof t == "number" ? t : c(this, fe);
			c(this, $) ?? v(this, $, {}),
				c(this, C) ?? v(this, C, new Headers()),
				yt(c(this, C), c(this, $)),
				c(this, D) &&
					(c(this, D).headers.forEach((s, i) => {
						var o, a;
						i === "set-cookie"
							? (o = c(this, C)) == null || o.append(i, s)
							: (a = c(this, C)) == null || a.set(i, s);
					}),
					yt(c(this, C), c(this, $))),
				r ?? (r = {});
			for (const [s, i] of Object.entries(r))
				if (typeof i == "string") c(this, C).set(s, i);
				else {
					c(this, C).delete(s);
					for (const o of i) c(this, C).append(s, o);
				}
			return new Response(e, { status: n, headers: c(this, C) });
		}),
		rr),
	j = "ALL",
	is = "all",
	os = ["get", "post", "put", "delete", "options", "patch"],
	_r = "Can not add a route since the matcher is already built.",
	Tt = class extends Error {},
	as = "__COMPOSED_HANDLER",
	ls = (e) => e.text("404 Not Found", 404),
	Jt = (e, t) =>
		"getResponse" in e
			? e.getResponse()
			: (console.error(e), t.text("Internal Server Error", 500)),
	_,
	T,
	Fr,
	G,
	le,
	Ye,
	et,
	nr,
	kt =
		((nr = class {
			constructor(t = {}) {
				P(this, T);
				w(this, "get");
				w(this, "post");
				w(this, "put");
				w(this, "delete");
				w(this, "options");
				w(this, "patch");
				w(this, "all");
				w(this, "on");
				w(this, "use");
				w(this, "router");
				w(this, "getPath");
				w(this, "_basePath", "/");
				P(this, _, "/");
				w(this, "routes", []);
				P(this, G, ls);
				w(this, "errorHandler", Jt);
				w(this, "onError", (t) => ((this.errorHandler = t), this));
				w(this, "notFound", (t) => (v(this, G, t), this));
				w(this, "fetch", (t, ...r) =>
					b(this, T, et).call(this, t, r[1], r[0], t.method),
				);
				w(this, "request", (t, r, n, s) =>
					t instanceof Request
						? this.fetch(r ? new Request(t, r) : t, n, s)
						: ((t = t.toString()),
							this.fetch(
								new Request(
									/^https?:\/\//.test(t) ? t : `http://localhost${ve("/", t)}`,
									r,
								),
								n,
								s,
							)),
				);
				w(this, "fire", () => {
					addEventListener("fetch", (t) => {
						t.respondWith(
							b(this, T, et).call(this, t.request, t, void 0, t.request.method),
						);
					});
				});
				[...os, is].forEach((i) => {
					this[i] = (o, ...a) => (
						typeof o == "string"
							? v(this, _, o)
							: b(this, T, le).call(this, i, c(this, _), o),
						a.forEach((l) => {
							b(this, T, le).call(this, i, c(this, _), l);
						}),
						this
					);
				}),
					(this.on = (i, o, ...a) => {
						for (const l of [o].flat()) {
							v(this, _, l);
							for (const f of [i].flat())
								a.map((u) => {
									b(this, T, le).call(this, f.toUpperCase(), c(this, _), u);
								});
						}
						return this;
					}),
					(this.use = (i, ...o) => (
						typeof i == "string"
							? v(this, _, i)
							: (v(this, _, "*"), o.unshift(i)),
						o.forEach((a) => {
							b(this, T, le).call(this, j, c(this, _), a);
						}),
						this
					));
				const { strict: n, ...s } = t;
				Object.assign(this, s),
					(this.getPath = (n ?? !0) ? (t.getPath ?? Lr) : es);
			}
			route(t, r) {
				const n = this.basePath(t);
				return (
					r.routes.map((s) => {
						var o;
						let i;
						r.errorHandler === Jt
							? (i = s.handler)
							: ((i = async (a, l) =>
									(await Kt([], r.errorHandler)(a, () => s.handler(a, l))).res),
								(i[as] = s.handler)),
							b((o = n), T, le).call(o, s.method, s.path, i);
					}),
					this
				);
			}
			basePath(t) {
				const r = b(this, T, Fr).call(this);
				return (r._basePath = ve(this._basePath, t)), r;
			}
			mount(t, r, n) {
				let s, i;
				n &&
					(typeof n == "function"
						? (i = n)
						: ((i = n.optionHandler),
							n.replaceRequest === !1
								? (s = (l) => l)
								: (s = n.replaceRequest)));
				const o = i
					? (l) => {
							const f = i(l);
							return Array.isArray(f) ? f : [f];
						}
					: (l) => {
							let f;
							try {
								f = l.executionCtx;
							} catch {}
							return [l.env, f];
						};
				s ||
					(s = (() => {
						const l = ve(this._basePath, t),
							f = l === "/" ? 0 : l.length;
						return (u) => {
							const h = new URL(u.url);
							return (
								(h.pathname = h.pathname.slice(f) || "/"), new Request(h, u)
							);
						};
					})());
				const a = async (l, f) => {
					const u = await r(s(l.req.raw), ...o(l));
					if (u) return u;
					await f();
				};
				return b(this, T, le).call(this, j, ve(t, "*"), a), this;
			}
		}),
		(_ = new WeakMap()),
		(T = new WeakSet()),
		(Fr = function () {
			const t = new kt({ router: this.router, getPath: this.getPath });
			return (t.routes = this.routes), t;
		}),
		(G = new WeakMap()),
		(le = function (t, r, n) {
			(t = t.toUpperCase()), (r = ve(this._basePath, r));
			const s = { path: r, method: t, handler: n };
			this.router.add(t, r, [n, s]), this.routes.push(s);
		}),
		(Ye = function (t, r) {
			if (t instanceof Error) return this.errorHandler(t, r);
			throw t;
		}),
		(et = function (t, r, n, s) {
			if (s === "HEAD")
				return (async () =>
					new Response(
						null,
						await b(this, T, et).call(this, t, r, n, "GET"),
					))();
			const i = this.getPath(t, { env: n }),
				o = this.router.match(s, i),
				a = new ss(t, {
					path: i,
					matchResult: o,
					env: n,
					executionCtx: r,
					notFoundHandler: c(this, G),
				});
			if (o[0].length === 1) {
				let f;
				try {
					f = o[0][0][0][0](a, async () => {
						a.res = await c(this, G).call(this, a);
					});
				} catch (u) {
					return b(this, T, Ye).call(this, u, a);
				}
				return f instanceof Promise
					? f
							.then(
								(u) => u || (a.finalized ? a.res : c(this, G).call(this, a)),
							)
							.catch((u) => b(this, T, Ye).call(this, u, a))
					: (f ?? c(this, G).call(this, a));
			}
			const l = Kt(o[0], this.errorHandler, c(this, G));
			return (async () => {
				try {
					const f = await l(a);
					if (!f.finalized)
						throw new Error(
							"Context is not finalized. Did you forget to return a Response object or `await next()`?",
						);
					return f.res;
				} catch (f) {
					return b(this, T, Ye).call(this, f, a);
				}
			})();
		}),
		nr),
	vt = Object.create(null),
	cs = /\/(:\w+(?:{(?:(?:{[\d,]+})|[^}])+})?)|\/[^\/\?]+|(\?)/g,
	fs = /\*/,
	xe,
	sr,
	us =
		((sr = class {
			constructor() {
				w(this, "name", "LinearRouter");
				P(this, xe, []);
			}
			add(e, t, r) {
				for (let n = 0, s = jt(t) || [t], i = s.length; n < i; n++)
					c(this, xe).push([e, s[n], r]);
			}
			match(e, t) {
				const r = [];
				e: for (let n = 0, s = c(this, xe).length; n < s; n++) {
					const [i, o, a] = c(this, xe)[n];
					if (i === e || i === j) {
						if (o === "*" || o === "/*") {
							r.push([a, vt]);
							continue;
						}
						const l = o.indexOf("*") !== -1,
							f = o.indexOf(":") !== -1;
						if (!l && !f) (o === t || o + "/" === t) && r.push([a, vt]);
						else if (l && !f) {
							const u = o.charCodeAt(o.length - 1) === 42,
								h = (u ? o.slice(0, -2) : o).split(fs),
								d = h.length - 1;
							for (let g = 0, p = 0, m = h.length; g < m; g++) {
								const y = h[g];
								if (t.indexOf(y, p) !== p) continue e;
								if (((p += y.length), g === d)) {
									if (
										!u &&
										p !== t.length &&
										!(p === t.length - 1 && t.charCodeAt(p) === 47)
									)
										continue e;
								} else {
									const x = t.indexOf("/", p);
									if (x === -1) continue e;
									p = x;
								}
							}
							r.push([a, vt]);
						} else if (f && !l) {
							const u = Object.create(null),
								h = o.match(cs),
								d = h.length - 1;
							for (let g = 0, p = 0, m = h.length; g < m; g++) {
								if (p === -1 || p >= t.length) continue e;
								const y = h[g];
								if (y.charCodeAt(1) === 58) {
									let E = y.slice(2),
										x;
									if (E.charCodeAt(E.length - 1) === 125) {
										const R = E.indexOf("{"),
											O = h[g + 1],
											S = O && O[1] !== ":" && O[1] !== "*" ? `(?=${O})` : "",
											oe = E.slice(R + 1, -1) + S,
											ae = t.slice(p + 1),
											B = new RegExp(oe, "d").exec(ae);
										if (!B || B.indices[0][0] !== 0 || B.indices[0][1] === 0)
											continue e;
										(E = E.slice(0, R)),
											(x = ae.slice(...B.indices[0])),
											(p += B.indices[0][1] + 1);
									} else {
										let R = t.indexOf("/", p + 1);
										if (R === -1) {
											if (p + 1 === t.length) continue e;
											R = t.length;
										}
										(x = t.slice(p + 1, R)), (p = R);
									}
									u[E] || (u[E] = x);
								} else {
									if (t.indexOf(y, p) !== p) continue e;
									p += y.length;
								}
								if (
									g === d &&
									p !== t.length &&
									!(p === t.length - 1 && t.charCodeAt(p) === 47)
								)
									continue e;
							}
							r.push([a, u]);
						} else if (f && l) throw new Tt();
					}
				}
				return [r];
			}
		}),
		(xe = new WeakMap()),
		sr),
	te,
	Z,
	ir,
	qr =
		((ir = class {
			constructor(e) {
				w(this, "name", "SmartRouter");
				P(this, te, []);
				P(this, Z, []);
				v(this, te, e.routers);
			}
			add(e, t, r) {
				if (!c(this, Z)) throw new Error(_r);
				c(this, Z).push([e, t, r]);
			}
			match(e, t) {
				if (!c(this, Z)) throw new Error("Fatal error");
				const r = c(this, te),
					n = c(this, Z),
					s = r.length;
				let i = 0,
					o;
				for (; i < s; i++) {
					const a = r[i];
					try {
						for (let l = 0, f = n.length; l < f; l++) a.add(...n[l]);
						o = a.match(e, t);
					} catch (l) {
						if (l instanceof Tt) continue;
						throw l;
					}
					(this.match = a.match.bind(a)), v(this, te, [a]), v(this, Z, void 0);
					break;
				}
				if (i === s) throw new Error("Fatal error");
				return (this.name = `SmartRouter + ${this.activeRouter.name}`), o;
			}
			get activeRouter() {
				if (c(this, Z) || c(this, te).length !== 1)
					throw new Error("No active router has been determined yet.");
				return c(this, te)[0];
			}
		}),
		(te = new WeakMap()),
		(Z = new WeakMap()),
		ir),
	Ce = Object.create(null),
	re,
	L,
	ue,
	Pe,
	k,
	J,
	ce,
	or,
	Br =
		((or = class {
			constructor(t, r, n) {
				P(this, J);
				P(this, re);
				P(this, L);
				P(this, ue);
				P(this, Pe, 0);
				P(this, k, Ce);
				if ((v(this, L, n || Object.create(null)), v(this, re, []), t && r)) {
					const s = Object.create(null);
					(s[t] = { handler: r, possibleKeys: [], score: 0 }), v(this, re, [s]);
				}
				v(this, ue, []);
			}
			insert(t, r, n) {
				v(this, Pe, ++Nt(this, Pe)._);
				let s = this;
				const i = Zn(r),
					o = [];
				for (let f = 0, u = i.length; f < u; f++) {
					const h = i[f],
						d = i[f + 1],
						g = Gt(h, d),
						p = Array.isArray(g) ? g[0] : h;
					if (Object.keys(c(s, L)).includes(p)) {
						s = c(s, L)[p];
						const m = Gt(h, d);
						m && o.push(m[1]);
						continue;
					}
					(c(s, L)[p] = new Br()),
						g && (c(s, ue).push(g), o.push(g[1])),
						(s = c(s, L)[p]);
				}
				const a = Object.create(null),
					l = {
						handler: n,
						possibleKeys: o.filter((f, u, h) => h.indexOf(f) === u),
						score: c(this, Pe),
					};
				return (a[t] = l), c(s, re).push(a), s;
			}
			search(t, r) {
				var l;
				const n = [];
				v(this, k, Ce);
				let i = [this];
				const o = Tr(r),
					a = [];
				for (let f = 0, u = o.length; f < u; f++) {
					const h = o[f],
						d = f === u - 1,
						g = [];
					for (let p = 0, m = i.length; p < m; p++) {
						const y = i[p],
							E = c(y, L)[h];
						E &&
							(v(E, k, c(y, k)),
							d
								? (c(E, L)["*"] &&
										n.push(
											...b(this, J, ce).call(this, c(E, L)["*"], t, c(y, k)),
										),
									n.push(...b(this, J, ce).call(this, E, t, c(y, k))))
								: g.push(E));
						for (let x = 0, R = c(y, ue).length; x < R; x++) {
							const O = c(y, ue)[x],
								S = c(y, k) === Ce ? {} : { ...c(y, k) };
							if (O === "*") {
								const Y = c(y, L)["*"];
								Y &&
									(n.push(...b(this, J, ce).call(this, Y, t, c(y, k))),
									v(Y, k, S),
									g.push(Y));
								continue;
							}
							if (h === "") continue;
							const [oe, ae, B] = O,
								W = c(y, L)[oe],
								Qr = o.slice(f).join("/");
							if (B instanceof RegExp) {
								const Y = B.exec(Qr);
								if (Y) {
									if (
										((S[ae] = Y[0]),
										n.push(...b(this, J, ce).call(this, W, t, c(y, k), S)),
										Object.keys(c(W, L)).length)
									) {
										v(W, k, S);
										const ot =
											((l = Y[0].match(/\//)) == null ? void 0 : l.length) ?? 0;
										(a[ot] || (a[ot] = [])).push(W);
									}
									continue;
								}
							}
							(B === !0 || B.test(h)) &&
								((S[ae] = h),
								d
									? (n.push(...b(this, J, ce).call(this, W, t, S, c(y, k))),
										c(W, L)["*"] &&
											n.push(
												...b(this, J, ce).call(
													this,
													c(W, L)["*"],
													t,
													S,
													c(y, k),
												),
											))
									: (v(W, k, S), g.push(W)));
						}
					}
					i = g.concat(a.shift() ?? []);
				}
				return (
					n.length > 1 && n.sort((f, u) => f.score - u.score),
					[n.map(({ handler: f, params: u }) => [f, u])]
				);
			}
		}),
		(re = new WeakMap()),
		(L = new WeakMap()),
		(ue = new WeakMap()),
		(Pe = new WeakMap()),
		(k = new WeakMap()),
		(J = new WeakSet()),
		(ce = function (t, r, n, s) {
			const i = [];
			for (let o = 0, a = c(t, re).length; o < a; o++) {
				const l = c(t, re)[o],
					f = l[r] || l[j],
					u = {};
				if (
					f !== void 0 &&
					((f.params = Object.create(null)),
					i.push(f),
					n !== Ce || (s && s !== Ce))
				)
					for (let h = 0, d = f.possibleKeys.length; h < d; h++) {
						const g = f.possibleKeys[h],
							p = u[f.score];
						(f.params[g] =
							s != null && s[g] && !p
								? s[g]
								: (n[g] ?? (s == null ? void 0 : s[g]))),
							(u[f.score] = !0);
					}
			}
			return i;
		}),
		or),
	he,
	ar,
	Ur =
		((ar = class {
			constructor() {
				w(this, "name", "TrieRouter");
				P(this, he);
				v(this, he, new Br());
			}
			add(e, t, r) {
				const n = jt(t);
				if (n) {
					for (let s = 0, i = n.length; s < i; s++)
						c(this, he).insert(e, n[s], r);
					return;
				}
				c(this, he).insert(e, t, r);
			}
			match(e, t) {
				return c(this, he).search(e, t);
			}
		}),
		(he = new WeakMap()),
		ar),
	hs = class extends kt {
		constructor(t = {}) {
			super(t), (this.router = new qr({ routers: [new us(), new Ur()] }));
		}
	},
	ds = (e) => {
		const r = {
				...{
					origin: "*",
					allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
					allowHeaders: [],
					exposeHeaders: [],
				},
				...e,
			},
			n = ((s) =>
				typeof s == "string"
					? s === "*"
						? () => s
						: (i) => (s === i ? i : null)
					: typeof s == "function"
						? s
						: (i) => (s.includes(i) ? i : null))(r.origin);
		return async function (i, o) {
			var f, u;
			function a(h, d) {
				i.res.headers.set(h, d);
			}
			const l = n(i.req.header("origin") || "", i);
			if ((l && a("Access-Control-Allow-Origin", l), r.origin !== "*")) {
				const h = i.req.header("Vary");
				h ? a("Vary", h) : a("Vary", "Origin");
			}
			if (
				(r.credentials && a("Access-Control-Allow-Credentials", "true"),
				(f = r.exposeHeaders) != null &&
					f.length &&
					a("Access-Control-Expose-Headers", r.exposeHeaders.join(",")),
				i.req.method === "OPTIONS")
			) {
				r.maxAge != null && a("Access-Control-Max-Age", r.maxAge.toString()),
					(u = r.allowMethods) != null &&
						u.length &&
						a("Access-Control-Allow-Methods", r.allowMethods.join(","));
				let h = r.allowHeaders;
				if (!(h != null && h.length)) {
					const d = i.req.header("Access-Control-Request-Headers");
					d && (h = d.split(/\s*,\s*/));
				}
				return (
					h != null &&
						h.length &&
						(a("Access-Control-Allow-Headers", h.join(",")),
						i.res.headers.append("Vary", "Access-Control-Request-Headers")),
					i.res.headers.delete("Content-Length"),
					i.res.headers.delete("Content-Type"),
					new Response(null, {
						headers: i.res.headers,
						status: 204,
						statusText: "No Content",
					})
				);
			}
			await o();
		};
	},
	Wr = class extends Error {
		constructor(t = 500, r) {
			super(r == null ? void 0 : r.message, {
				cause: r == null ? void 0 : r.cause,
			});
			w(this, "res");
			w(this, "status");
			(this.res = r == null ? void 0 : r.res), (this.status = t);
		}
		getResponse() {
			return this.res
				? new Response(this.res.body, {
						status: this.status,
						headers: this.res.headers,
					})
				: new Response(this.message, { status: this.status });
		}
	},
	ps = /^(GET|HEAD)$/,
	gs =
		/^\b(application\/x-www-form-urlencoded|multipart\/form-data|text\/plain)\b/i,
	ys = (e) => {
		const t = (
				(n) => (s, i) =>
					s === new URL(i.req.url).origin
			)(),
			r = (n, s) => (n === void 0 ? !1 : t(n, s));
		return async function (s, i) {
			if (
				!ps.test(s.req.method) &&
				gs.test(s.req.header("content-type") || "text/plain") &&
				!r(s.req.header("origin"), s)
			) {
				const o = new Response("Forbidden", { status: 403 });
				throw new Wr(403, { res: o });
			}
			await i();
		};
	},
	vs = new Wr(504, { message: "Gateway Timeout" }),
	ms = (e, t = vs) =>
		async function (n, s) {
			let i;
			const o = new Promise((a, l) => {
				i = setTimeout(() => {
					l(typeof t == "function" ? t(n) : t);
				}, e);
			});
			try {
				await Promise.race([s(), o]);
			} finally {
				i !== void 0 && clearTimeout(i);
			}
		};
function ws() {
	const { process: e, Deno: t } = globalThis;
	return !(typeof (t == null ? void 0 : t.noColor) == "boolean"
		? t.noColor
		: e !== void 0
			? "NO_COLOR" in (e == null ? void 0 : e.env)
			: !1);
}
var Es = (e) => {
		const [t, r] = [",", "."];
		return e
			.map((s) => s.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + t))
			.join(r);
	},
	xs = (e) => {
		const t = Date.now() - e;
		return Es([t < 1e3 ? t + "ms" : Math.round(t / 1e3) + "s"]);
	},
	Ps = (e) => {
		if (ws())
			switch ((e / 100) | 0) {
				case 5:
					return `\x1B[31m${e}\x1B[0m`;
				case 4:
					return `\x1B[33m${e}\x1B[0m`;
				case 3:
					return `\x1B[36m${e}\x1B[0m`;
				case 2:
					return `\x1B[32m${e}\x1B[0m`;
			}
		return `${e}`;
	};
function Qt(e, t, r, n, s = 0, i) {
	const o = t === "<--" ? `${t} ${r} ${n}` : `${t} ${r} ${n} ${Ps(s)} ${i}`;
	e(o);
}
var bs = (e = console.log) =>
		async function (r, n) {
			const { method: s, url: i } = r.req,
				o = i.slice(i.indexOf("/", 8));
			Qt(e, "<--", s, o);
			const a = Date.now();
			await n(), Qt(e, "-->", s, o, r.res.status, xs(a));
		},
	Rs = (e) => {
		const t = "pretty";
		return async function (n, s) {
			var o;
			const i = n.req.query(t) || n.req.query(t) === "";
			if (
				(await s(),
				i &&
					(o = n.res.headers.get("Content-Type")) != null &&
					o.startsWith("application/json"))
			) {
				const a = await n.res.json();
				n.res = new Response(JSON.stringify(a, null, 2), n.res);
			}
		};
	},
	Os = () =>
		async function (t, r) {
			if (
				(await r(),
				t.res.status === 404 &&
					(t.req.method === "GET" || t.req.method === "HEAD") &&
					t.req.path !== "/" &&
					t.req.path.at(-1) === "/")
			) {
				const n = new URL(t.req.url);
				(n.pathname = n.pathname.substring(0, n.pathname.length - 1)),
					(t.res = t.redirect(n.toString(), 301));
			}
		},
	Ss = {
		crossOriginEmbedderPolicy: ["Cross-Origin-Embedder-Policy", "require-corp"],
		crossOriginResourcePolicy: ["Cross-Origin-Resource-Policy", "same-origin"],
		crossOriginOpenerPolicy: ["Cross-Origin-Opener-Policy", "same-origin"],
		originAgentCluster: ["Origin-Agent-Cluster", "?1"],
		referrerPolicy: ["Referrer-Policy", "no-referrer"],
		strictTransportSecurity: [
			"Strict-Transport-Security",
			"max-age=15552000; includeSubDomains",
		],
		xContentTypeOptions: ["X-Content-Type-Options", "nosniff"],
		xDnsPrefetchControl: ["X-DNS-Prefetch-Control", "off"],
		xDownloadOptions: ["X-Download-Options", "noopen"],
		xFrameOptions: ["X-Frame-Options", "SAMEORIGIN"],
		xPermittedCrossDomainPolicies: [
			"X-Permitted-Cross-Domain-Policies",
			"none",
		],
		xXssProtection: ["X-XSS-Protection", "0"],
	},
	Cs = {
		crossOriginEmbedderPolicy: !1,
		crossOriginResourcePolicy: !0,
		crossOriginOpenerPolicy: !0,
		originAgentCluster: !0,
		referrerPolicy: !0,
		strictTransportSecurity: !0,
		xContentTypeOptions: !0,
		xDnsPrefetchControl: !0,
		xDownloadOptions: !0,
		xFrameOptions: !0,
		xPermittedCrossDomainPolicies: !0,
		xXssProtection: !0,
		removePoweredBy: !0,
		permissionsPolicy: {},
	},
	As = (e) => {
		const t = { ...Cs, ...e },
			r = $s(t),
			n = [];
		if (t.contentSecurityPolicy) {
			const [s, i] = Yt(t.contentSecurityPolicy);
			s && n.push(s), r.push(["Content-Security-Policy", i]);
		}
		if (t.contentSecurityPolicyReportOnly) {
			const [s, i] = Yt(t.contentSecurityPolicyReportOnly);
			s && n.push(s), r.push(["Content-Security-Policy-Report-Only", i]);
		}
		return (
			t.permissionsPolicy &&
				Object.keys(t.permissionsPolicy).length > 0 &&
				r.push(["Permissions-Policy", js(t.permissionsPolicy)]),
			t.reportingEndpoints &&
				r.push(["Reporting-Endpoints", ks(t.reportingEndpoints)]),
			t.reportTo && r.push(["Report-To", Ls(t.reportTo)]),
			async function (i, o) {
				const a = n.length === 0 ? r : n.reduce((l, f) => f(i, l), r);
				await o(),
					Ns(i, a),
					t != null &&
						t.removePoweredBy &&
						i.res.headers.delete("X-Powered-By");
			}
		);
	};
function $s(e) {
	return Object.entries(Ss)
		.filter(([t]) => e[t])
		.map(([t, r]) => {
			const n = e[t];
			return typeof n == "string" ? [r[0], n] : r;
		});
}
function Yt(e) {
	const t = [],
		r = [];
	for (const [n, s] of Object.entries(e)) {
		const i = Array.isArray(s) ? s : [s];
		i.forEach((o, a) => {
			if (typeof o == "function") {
				const l = a * 2 + 2 + r.length;
				t.push((f, u) => {
					u[l] = o(f, n);
				});
			}
		}),
			r.push(
				n.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (o, a) =>
					a ? "-" + o.toLowerCase() : o.toLowerCase(),
				),
				...i.flatMap((o) => [" ", o]),
				"; ",
			);
	}
	return (
		r.pop(),
		t.length === 0
			? [void 0, r.join("")]
			: [
					(n, s) =>
						s.map((i) => {
							if (
								i[0] === "Content-Security-Policy" ||
								i[0] === "Content-Security-Policy-Report-Only"
							) {
								const o = i[1].slice();
								return (
									t.forEach((a) => {
										a(n, o);
									}),
									[i[0], o.join("")]
								);
							} else return i;
						}),
					r,
				]
	);
}
function js(e) {
	return Object.entries(e)
		.map(([t, r]) => {
			const n = Ts(t);
			if (typeof r == "boolean") return `${n}=${r ? "*" : "none"}`;
			if (Array.isArray(r)) {
				if (r.length === 0) return `${n}=()`;
				if (r.length === 1 && (r[0] === "*" || r[0] === "none"))
					return `${n}=${r[0]}`;
				const s = r.map((i) => (["self", "src"].includes(i) ? i : `"${i}"`));
				return `${n}=(${s.join(" ")})`;
			}
			return "";
		})
		.filter(Boolean)
		.join(", ");
}
function Ts(e) {
	return e.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase();
}
function ks(e = []) {
	return e.map((t) => `${t.name}="${t.url}"`).join(", ");
}
function Ls(e = []) {
	return e.map((t) => JSON.stringify(t)).join(", ");
}
function Ns(e, t) {
	t.forEach(([r, n]) => {
		e.res.headers.set(r, n);
	});
}
const U = new hs();
U.use(As());
U.use(ds());
U.use(ys());
U.use(ms(2e3));
U.use(bs());
U.use(Rs());
U.use(Os());
U.use(Wn);
U.get("/", (e) =>
	e.render(
		Ae("h1", { children: "Hello, World! from Vite + Cloudflare Workers!" }),
	),
);
var st = "[^/]+",
	Te = ".*",
	ke = "(?:|/.*)",
	je = Symbol(),
	Ds = new Set(".\\+*[^]$()");
function Hs(e, t) {
	return e.length === 1
		? t.length === 1
			? e < t
				? -1
				: 1
			: -1
		: t.length === 1 || e === Te || e === ke
			? 1
			: t === Te || t === ke
				? -1
				: e === st
					? 1
					: t === st
						? -1
						: e.length === t.length
							? e < t
								? -1
								: 1
							: t.length - e.length;
}
var de,
	pe,
	F,
	lr,
	bt =
		((lr = class {
			constructor() {
				P(this, de);
				P(this, pe);
				P(this, F, Object.create(null));
			}
			insert(e, t, r, n, s) {
				if (e.length === 0) {
					if (c(this, de) !== void 0) throw je;
					if (s) return;
					v(this, de, t);
					return;
				}
				const [i, ...o] = e,
					a =
						i === "*"
							? o.length === 0
								? ["", "", Te]
								: ["", "", st]
							: i === "/*"
								? ["", "", ke]
								: i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
				let l;
				if (a) {
					const f = a[1];
					let u = a[2] || st;
					if (
						f &&
						a[2] &&
						((u = u.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:")),
						/\((?!\?:)/.test(u))
					)
						throw je;
					if (((l = c(this, F)[u]), !l)) {
						if (Object.keys(c(this, F)).some((h) => h !== Te && h !== ke))
							throw je;
						if (s) return;
						(l = c(this, F)[u] = new bt()), f !== "" && v(l, pe, n.varIndex++);
					}
					!s && f !== "" && r.push([f, c(l, pe)]);
				} else if (((l = c(this, F)[i]), !l)) {
					if (
						Object.keys(c(this, F)).some(
							(f) => f.length > 1 && f !== Te && f !== ke,
						)
					)
						throw je;
					if (s) return;
					l = c(this, F)[i] = new bt();
				}
				l.insert(o, t, r, n, s);
			}
			buildRegExpStr() {
				const t = Object.keys(c(this, F))
					.sort(Hs)
					.map((r) => {
						const n = c(this, F)[r];
						return (
							(typeof c(n, pe) == "number"
								? `(${r})@${c(n, pe)}`
								: Ds.has(r)
									? `\\${r}`
									: r) + n.buildRegExpStr()
						);
					});
				return (
					typeof c(this, de) == "number" && t.unshift(`#${c(this, de)}`),
					t.length === 0
						? ""
						: t.length === 1
							? t[0]
							: "(?:" + t.join("|") + ")"
				);
			}
		}),
		(de = new WeakMap()),
		(pe = new WeakMap()),
		(F = new WeakMap()),
		lr),
	it,
	qe,
	cr,
	Ms =
		((cr = class {
			constructor() {
				P(this, it, { varIndex: 0 });
				P(this, qe, new bt());
			}
			insert(e, t, r) {
				const n = [],
					s = [];
				for (let o = 0; ; ) {
					let a = !1;
					if (
						((e = e.replace(/\{[^}]+\}/g, (l) => {
							const f = `@\\${o}`;
							return (s[o] = [f, l]), o++, (a = !0), f;
						})),
						!a)
					)
						break;
				}
				const i = e.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
				for (let o = s.length - 1; o >= 0; o--) {
					const [a] = s[o];
					for (let l = i.length - 1; l >= 0; l--)
						if (i[l].indexOf(a) !== -1) {
							i[l] = i[l].replace(a, s[o][1]);
							break;
						}
				}
				return c(this, qe).insert(i, t, n, c(this, it), r), n;
			}
			buildRegExp() {
				let e = c(this, qe).buildRegExpStr();
				if (e === "") return [/^$/, [], []];
				let t = 0;
				const r = [],
					n = [];
				return (
					(e = e.replace(/#(\d+)|@(\d+)|\.\*\$/g, (s, i, o) =>
						i !== void 0
							? ((r[++t] = Number(i)), "$()")
							: (o !== void 0 && (n[Number(o)] = ++t), ""),
					)),
					[new RegExp(`^${e}`), r, n]
				);
			}
		}),
		(it = new WeakMap()),
		(qe = new WeakMap()),
		cr),
	Vr = [],
	Is = [/^$/, [], Object.create(null)],
	tt = Object.create(null);
function Xr(e) {
	return (
		tt[e] ??
		(tt[e] = new RegExp(
			e === "*"
				? ""
				: `^${e.replace(/\/\*$|([.\\+*[^\]$()])/g, (t, r) => (r ? `\\${r}` : "(?:|/.*)"))}$`,
		))
	);
}
function _s() {
	tt = Object.create(null);
}
function Fs(e) {
	var f;
	const t = new Ms(),
		r = [];
	if (e.length === 0) return Is;
	const n = e
			.map((u) => [!/\*|\/:/.test(u[0]), ...u])
			.sort(([u, h], [d, g]) => (u ? 1 : d ? -1 : h.length - g.length)),
		s = Object.create(null);
	for (let u = 0, h = -1, d = n.length; u < d; u++) {
		const [g, p, m] = n[u];
		g ? (s[p] = [m.map(([E]) => [E, Object.create(null)]), Vr]) : h++;
		let y;
		try {
			y = t.insert(p, h, g);
		} catch (E) {
			throw E === je ? new Tt(p) : E;
		}
		g ||
			(r[h] = m.map(([E, x]) => {
				const R = Object.create(null);
				for (x -= 1; x >= 0; x--) {
					const [O, S] = y[x];
					R[O] = S;
				}
				return [E, R];
			}));
	}
	const [i, o, a] = t.buildRegExp();
	for (let u = 0, h = r.length; u < h; u++)
		for (let d = 0, g = r[u].length; d < g; d++) {
			const p = (f = r[u][d]) == null ? void 0 : f[1];
			if (!p) continue;
			const m = Object.keys(p);
			for (let y = 0, E = m.length; y < E; y++) p[m[y]] = a[p[m[y]]];
		}
	const l = [];
	for (const u in o) l[u] = r[o[u]];
	return [i, l, s];
}
function ye(e, t) {
	if (e) {
		for (const r of Object.keys(e).sort((n, s) => s.length - n.length))
			if (Xr(r).test(t)) return [...e[r]];
	}
}
var ne,
	se,
	Oe,
	zr,
	Kr,
	fr,
	qs =
		((fr = class {
			constructor() {
				P(this, Oe);
				w(this, "name", "RegExpRouter");
				P(this, ne);
				P(this, se);
				v(this, ne, { [j]: Object.create(null) }),
					v(this, se, { [j]: Object.create(null) });
			}
			add(e, t, r) {
				var a;
				const n = c(this, ne),
					s = c(this, se);
				if (!n || !s) throw new Error(_r);
				n[e] ||
					[n, s].forEach((l) => {
						(l[e] = Object.create(null)),
							Object.keys(l[j]).forEach((f) => {
								l[e][f] = [...l[j][f]];
							});
					}),
					t === "/*" && (t = "*");
				const i = (t.match(/\/:/g) || []).length;
				if (/\*$/.test(t)) {
					const l = Xr(t);
					e === j
						? Object.keys(n).forEach((f) => {
								var u;
								(u = n[f])[t] || (u[t] = ye(n[f], t) || ye(n[j], t) || []);
							})
						: (a = n[e])[t] || (a[t] = ye(n[e], t) || ye(n[j], t) || []),
						Object.keys(n).forEach((f) => {
							(e === j || e === f) &&
								Object.keys(n[f]).forEach((u) => {
									l.test(u) && n[f][u].push([r, i]);
								});
						}),
						Object.keys(s).forEach((f) => {
							(e === j || e === f) &&
								Object.keys(s[f]).forEach(
									(u) => l.test(u) && s[f][u].push([r, i]),
								);
						});
					return;
				}
				const o = jt(t) || [t];
				for (let l = 0, f = o.length; l < f; l++) {
					const u = o[l];
					Object.keys(s).forEach((h) => {
						var d;
						(e === j || e === h) &&
							((d = s[h])[u] ||
								(d[u] = [...(ye(n[h], u) || ye(n[j], u) || [])]),
							s[h][u].push([r, i - f + l + 1]));
					});
				}
			}
			match(e, t) {
				_s();
				const r = b(this, Oe, zr).call(this);
				return (
					(this.match = (n, s) => {
						const i = r[n] || r[j],
							o = i[2][s];
						if (o) return o;
						const a = s.match(i[0]);
						if (!a) return [[], Vr];
						const l = a.indexOf("", 1);
						return [i[1][l], a];
					}),
					this.match(e, t)
				);
			}
		}),
		(ne = new WeakMap()),
		(se = new WeakMap()),
		(Oe = new WeakSet()),
		(zr = function () {
			const e = Object.create(null);
			return (
				Object.keys(c(this, se))
					.concat(Object.keys(c(this, ne)))
					.forEach((t) => {
						e[t] || (e[t] = b(this, Oe, Kr).call(this, t));
					}),
				v(this, ne, v(this, se, void 0)),
				e
			);
		}),
		(Kr = function (e) {
			const t = [];
			let r = e === j;
			return (
				[c(this, ne), c(this, se)].forEach((n) => {
					const s = n[e] ? Object.keys(n[e]).map((i) => [i, n[e][i]]) : [];
					s.length !== 0
						? (r || (r = !0), t.push(...s))
						: e !== j && t.push(...Object.keys(n[j]).map((i) => [i, n[j][i]]));
				}),
				r ? Fs(t) : null
			);
		}),
		fr),
	Bs = class extends kt {
		constructor(e = {}) {
			super(e),
				(this.router = e.router ?? new qr({ routers: [new qs(), new Ur()] }));
		}
	};
const Rt = new Bs(),
	Gr = Object.assign({ "/src/index.tsx": U });
let Zr = !1;
for (const [, e] of Object.entries(Gr))
	e &&
		(Rt.all("*", (t) => {
			let r;
			try {
				r = t.executionCtx;
			} catch {}
			return e.fetch(t.req.raw, t.env, r);
		}),
		Rt.notFound((t) => {
			let r;
			try {
				r = t.executionCtx;
			} catch {}
			return e.fetch(t.req.raw, t.env, r);
		}),
		(Zr = !0));
if (!Zr)
	throw new Error(
		"Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']",
	);
const Jr = {},
	er = new Set();
for (const [e, t] of Object.entries(Gr))
	for (const [r, n] of Object.entries(t))
		if (r !== "fetch") {
			if (er.has(r))
				throw new Error(
					`Handler "${r}" is defined in multiple entry files. Please ensure each handler (except fetch) is defined only once.`,
				);
			er.add(r), (Jr[r] = n);
		}
const Ks = { ...Jr, fetch: Rt.fetch };
export { Ks as default };
