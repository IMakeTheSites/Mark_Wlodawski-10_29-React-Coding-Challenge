import {FC} from 'react';
import {connect} from 'react-redux';

import {RootState, UserInputType, JournalType} from 'types';
import {dateToString, toCSV} from 'utils';

interface Balance {
  ACCOUNT: string;
  DESCRIPTION: string;
  DEBIT: number;
  CREDIT: number;
  BALANCE: number;
}

interface ConnectProps {
  balance: Balance[];
  totalCredit: number;
  totalDebit: number;
  userInput: UserInputType;
}

const BalanceOutput: FC<ConnectProps> = ({balance, totalCredit, totalDebit, userInput}) => {
  if (!userInput.format || !userInput.startPeriod || !userInput.endPeriod) return null;

  return (
    <div className="output">
      <p>
        Total Debit: {totalDebit} Total Credit: {totalCredit}
        <br />
        Balance from account {userInput.startAccount || '*'} to {userInput.endAccount || '*'} from period{' '}
        {dateToString(userInput.startPeriod)} to {dateToString(userInput.endPeriod)}
      </p>
      {userInput.format === 'CSV' ? <pre>{toCSV(balance)}</pre> : null}
      {userInput.format === 'HTML' ? (
        <table className="table">
          <thead>
            <tr>
              <th>ACCOUNT</th>
              <th>DESCRIPTION</th>
              <th>DEBIT</th>
              <th>CREDIT</th>
              <th>BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {balance.map((entry, i) => (
              <tr key={i}>
                <th scope="row">{entry.ACCOUNT}</th>
                <td>{entry.DESCRIPTION}</td>
                <td>{entry.DEBIT}</td>
                <td>{entry.CREDIT}</td>
                <td>{entry.BALANCE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
};

interface ILabelByAccount {
  [key: number]: string;
}
interface IJournalsByAccount {
  [key: number]: Omit<JournalType, 'PERIOD'> & {
    DESCRIPTION: string;
    BALANCE: number;
  };
}

export default connect(
  ({ userInput, accounts, journalEntries }: RootState): ConnectProps => {
    let balance: Balance[] = [];
    let totalCredit = 0;
    let totalDebit = 0;

    /* YOUR CODE GOES HERE */
    const labelByAccount: ILabelByAccount = {};
    accounts.forEach(acc => {
      labelByAccount[acc.ACCOUNT] = acc.LABEL;
    });

    const journalsByAccount: IJournalsByAccount = {};
    journalEntries.forEach(
      (entry) =>
        {
          const isValid =
            labelByAccount[entry.ACCOUNT] && // if entry exists in accounts
            (!userInput.startAccount || entry.ACCOUNT >= userInput.startAccount) &&
            (!userInput.endAccount || entry.ACCOUNT <= userInput.endAccount) &&
            (!userInput.startPeriod ||
              !Date.parse(userInput.startPeriod.toString()) || // if input is '*', startPeriod is 'Invalid Date'
              entry.PERIOD.getTime() >= userInput.startPeriod.getTime()) &&
            (!userInput.endPeriod ||
              !Date.parse(userInput.endPeriod.toString()) || // if input is '*', endPeriod is 'Invalid Date'
              entry.PERIOD.getTime() <= userInput.endPeriod.getTime());

          if (!isValid) return;

          totalDebit += entry.DEBIT;
          totalCredit += entry.CREDIT;

          if (!journalsByAccount[entry.ACCOUNT]) {
            journalsByAccount[entry.ACCOUNT] = {
              ACCOUNT: entry.ACCOUNT,
              DEBIT: entry.DEBIT,
              CREDIT: entry.CREDIT,
              DESCRIPTION: labelByAccount[entry.ACCOUNT],
              BALANCE: entry.DEBIT - entry.CREDIT,
            }
          } else {
            const {DEBIT, CREDIT, BALANCE } = journalsByAccount[entry.ACCOUNT];
            journalsByAccount[entry.ACCOUNT] = {
              ...journalsByAccount[entry.ACCOUNT],
              DEBIT: DEBIT + entry.DEBIT,
              CREDIT: CREDIT + entry.CREDIT,
              BALANCE: BALANCE + entry.DEBIT - entry.CREDIT,
            };
          }
        }
      );
    
    balance = Object.values(journalsByAccount);

    return {
      balance,
      totalCredit,
      totalDebit,
      userInput,
    };
  },
)(BalanceOutput);
