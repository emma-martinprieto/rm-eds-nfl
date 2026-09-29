import { icon } from '../../scripts/nfl-icons.js';

/* 09 · FAQ — prototype index.html L418-459. Native <details>/<summary>, no JS behaviour.
   The answer is a direct child <p> of <details> (the CSS targets `.faq__item p`). */
export default function decorate(block) {
  const list = document.createElement('div');
  list.className = 'faq__list';

  [...block.children].forEach((row) => {
    const [questionCell, answerCell] = [...row.children];
    const details = document.createElement('details');
    details.className = 'faq__item';

    const summary = document.createElement('summary');
    const label = document.createElement('span');
    label.textContent = questionCell ? questionCell.textContent.trim() : '';
    summary.append(label, icon('chevron-down', 'faq__icon'));
    details.append(summary);

    if (answerCell) details.append(...answerCell.childNodes);
    list.append(details);
  });

  block.replaceChildren(list);
}
