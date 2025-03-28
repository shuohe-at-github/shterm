with open('./EastAsianWidth.v17.txt', 'r', encoding='utf-8') as f:
    last_line = 'N'
    wide_begin = ''
    wide_end = ''
    range_comments = []

    for line in f:
        comment = ''
        i = line.find('#')
        if i >= 0:
            comment = line[i:].strip()
            line = line[:i].strip()

        if len(line) == 0:
            continue
        
        # 如果是宽
        if '; W' in line or '; F' in line:
            line = line.split(';')[0].strip()
            parts = line.split('..')
            begin = parts[0].strip()
            end = begin if len(parts) == 1 else parts[1].strip()

            if last_line == 'N':
                wide_begin = begin
                range_comments = []
            
            wide_end = end
            range_comments.append(comment)

            last_line = 'W'
        else:
            if last_line == 'W':
                for comment in range_comments:
                    print(comment)
                print(f'(0x{wide_begin} , 0x{wide_end})\n')
                wide_begin = ''
                wide_end = ''
            
            last_line = 'N'
