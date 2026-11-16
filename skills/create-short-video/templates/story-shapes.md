# Story shapes

Templates, not rules. Merge or split beats when the story needs it. A shape becomes "proven" once a real clip in that shape has shipped.

## News (proven: Microsoft 365 outage, 8 beats, 62 s)
| # | Job | Example |
|---|---|---|
| 1 | What happened, when, is it still going | ล่มทั่วโลก ยังไม่กลับมาปกติ |
| 2 | What broke first, then what it spread to | Exchange -> Outlook/Teams/Copilot |
| 3 | Scale, with an honest label on the number | ~130,000 reports (not users) |
| 4 | The rumour or misconception, corrected | ไม่ใช่การโจมตีไซเบอร์ |
| 5 | Mechanism, step 1 | health check -> servers pulled |
| 6 | Mechanism, the twist | restart -> traffic -> crash again |
| 7 | What they tried, what is working | patch, stabilising |
| 8 | Status now, what to wait for, sources on screen | รอ Post-Incident Report |
Live rules: trust the primary source over aggregators; stamp the time on screen and in captions; if the status flips after delivery, re-voice only beats 1 and 8.

## Tool review (proven: narze/skillsets, 10 beats, 85 s)
| # | Job | Example |
|---|---|---|
| 1 | The setup a viewer recognises | ลงสกิลสองชุด 38+56 = 94 |
| 2 | The pain, shown | context บวม, ชื่อชนกัน |
| 3 | The second pain, or why the obvious fix fails | ลงใน project แล้วเผลอ commit |
| 4 | Both obvious options, crossed out, plus the real insight | ติดตั้ง ≠ สิ่งที่อยู่ใน context |
| 5 | The tool's idea | ไม่ลงอะไรในโปรเจกต์เลย |
| 6 | How it works / what it supports | 5 agents, one copy |
| 7 | The payoff | 0 skill files in the repo |
| 8 | How to use it safely | อ่าน diff ก่อน merge |
| 9 | The catch, verified | no LICENSE, 144 skills from 6 sources |
| 10 | The verdict, held ~1 s | fork เถอะ แล้วแก้ LICENSE ก่อน |
Rules: test the tool yourself or say plainly that you didn't; the catch (beat 9) must be something you checked, not something you guessed.

## Demo / concept (proven: Thai OCR in the browser, 8 beats, 87 s, self-recorded)
| # | Job | Example |
|---|---|---|
| 1 | The usual way and the claim that breaks it | ปกติต้องส่งรูปขึ้นเซิร์ฟเวอร์ แต่เว็บนี้ไม่ต้อง |
| 2 | Why it is possible (what moved where) | โมเดล ~4 MB รันในเบราว์เซอร์ |
| 3 | The cost, measured, plus the surprise in it | โหลด ~20 MB ส่วนใหญ่เป็น runtime |
| 4-6 | The pipeline, one step per beat | หาตำแหน่ง -> อ่านทีละบรรทัด -> จัดเรียง/คัดออก |
| 7 | The result you reproduced, and its limits | 10/10 บรรทัด ผิด 3 ตัว, รูปเดียว, ไม่หมุนรูปเอียง |
| 8 | Credits + where to try it | iApp, dt.in.th, URL |
Rules: run the demo yourself, measure sizes and numbers, label one-sample results as one sample.

## Concept (not yet proven)
1 Hook question, 2 the everyday analogy, 3-5 the mechanism one step per beat, 6 where the analogy breaks, 7 a real-world example, 8 the one-line takeaway.
Use one analogy, keep it for one point, then drop it.

## How-to (not yet proven)
1 The result first, 2 what you need, 3-6 one step per beat (the command or click on screen), 7 the common mistake, 8 the result again plus where to read more.
Run every step yourself before voicing it.
