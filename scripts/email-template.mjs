// 生日祝福邮件模板 —— 与生日页面同一套视觉语言：
// 近黑信笺（#0A0A0B / #111113）、暖白衬线字（#F2F0EB）、金色强调（#D6B574）、
// 细分隔线、大留白、克制排版。蛋糕图为透明底，直接融入深色卡片。

export function buildEmailHtml({
  name,
  age,
  birthMonth,
  birthDay,
  cakeImageUrl,
  siteUrl,
  footerText,
  wish,
}) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#0A0A0B;">
<div style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;">今天是你 ${age} 岁生日，愿你身心自在、愿望成真&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0A0A0B" style="width:100%;background-color:#0A0A0B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#111113" style="width:100%;max-width:600px;background-color:#111113;border:1px solid #232326;border-radius:18px;overflow:hidden;">
    <!-- 抬头：编辑式左对齐 -->
    <tr><td style="padding:44px 38px 28px;">
      <div style="font-size:12px;color:#D6B574;letter-spacing:0.28em;font-weight:600;">${birthMonth} 月 ${birthDay} 日 · 生日快乐</div>
      <div style="font-family:Georgia,'Times New Roman','Noto Serif SC','Songti SC',serif;font-size:37px;color:#F2F0EB;margin-top:18px;letter-spacing:0.01em;">生日快乐，${name}。</div>
    </td></tr>
    <tr><td style="height:1px;background:#1B1B1D;font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- 蛋糕：全信唯一的视觉焦点（暖金光晕 + 完整原图不裁切） -->
    <tr><td align="center" bgcolor="#111113" style="background-color:#111113;background-image:radial-gradient(ellipse 62% 46% at 50% 40%,rgba(214,181,116,0.16),rgba(214,181,116,0) 72%);padding:30px 0 6px;">
      <img src="${cakeImageUrl}" alt="点着蜡烛的生日蛋糕" style="width:88%;max-width:none;height:auto;display:block;margin:0 auto;" />
    </td></tr>

    <!-- 年龄：副注，不抢戏 -->
    <tr><td align="center" style="padding:20px 34px 0;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:46px;color:#D6B574;line-height:1;letter-spacing:0.02em;">${age}<span style="font-size:15px;color:#918B82;margin-left:8px;letter-spacing:0.22em;">岁</span></div>
    </td></tr>

    <!-- 信笺正文 -->
    <tr><td align="center" style="padding:26px 36px 0;">
      <div style="font-size:18.5px;color:#C8C3BA;line-height:1.85;letter-spacing:0.02em;">${wish}</div>
      <div style="font-family:Georgia,'Times New Roman','Noto Serif SC','Songti SC',serif;font-size:15px;color:#9A958D;font-style:italic;margin-top:26px;">—— 来自未来的自己</div>
    </td></tr>

    <!-- CTA：站点同款金色实心按钮 -->
    <tr><td align="center" style="padding:36px 34px 44px;">
      <a href="${siteUrl}" target="_blank" style="display:inline-block;padding:13px 34px;background:#D6B574;color:#0A0A0B;font-size:13px;font-weight:600;text-decoration:none;border-radius:4px;letter-spacing:0.1em;">去许愿&nbsp;→</a>
    </td></tr>

    <!-- 落款 -->
    <tr><td style="height:1px;background:#1B1B1D;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr><td align="center" style="padding:17px 34px 20px;">
      <div style="font-size:11px;color:#6E6A64;letter-spacing:0.2em;">${footerText}</div>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

export function buildEmailPlain({ name, age, birthMonth, birthDay, siteUrl, wish }) {
  return `生日快乐，${name}！

今天是你 ${age} 岁生日（${birthMonth} 月 ${birthDay} 日）。
${wish}

—— 来自未来的自己

${siteUrl}`
}
